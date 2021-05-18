var gameCanvas, ctx,tiles;
window.onload=function(){
    gameCanvas = document.getElementById('gameCanvas');
    ctx = gameCanvas.getContext('2d');
    gameCanvas.onwheel = function(e){
        sizeTile(tileSize+e.deltaY*-0.04);
    }
    tiles = new Image(  )
    tiles.src = 'tiles0.png';
    playerTiles = new Image();
    playerTiles.src='playerTiles.png';
    var overlay = document.getElementById('overlay');

    function fitCanvas() {
        gameCanvas.width  = window.innerWidth;
        gameCanvas.height = window.innerHeight;
        overlay.width  = window.innerWidth;
        overlay.height = window.innerHeight;
        overlay.style.left=0;
        overlay.style.top=0;
        sizeTile(tileSize);
    };
    fitCanvas();
    window.addEventListener('resize', fitCanvas);
    
    document.getElementById('login').onclick=function(){
        wsMessege('login',{
            username:document.getElementById('userName').value,
            password:document.getElementById('userAuth').value
        })
    }
    document.getElementById('register').onclick=function(){
        wsMessege('register',{
            username:document.getElementById('userName').value,
            password:document.getElementById('userAuth').value
        })
    }

    document.getElementById('joinRealm').onclick=function(){
        wsMessege('joinRealm',{
            id:document.getElementById('realmId').value
        })
    }
    document.getElementById('makeRealm').onclick=function(){
        wsMessege('makeRealm',{
            id:document.getElementById('realmId').value
        })
    }
}
let ws = new WebSocket("ws://localhost:3333");
const tau = Math.PI*2;
var zale = 1;
var realmCtx, lastT,localPlayer;
var map={};
//TODO:     buffer previus chunks outside of render distance
var tileSize = 16;
function sizeTile(s){
    if(s<8)
        s=8;
    tileSize=s;
    ctx.resetTransform();
    ctx.scale(s,s);
    ctx.imageSmoothingEnabled=false;
}
var hCol={};
var vCol={};
ws.onmessage = message => {
    var method,msg;
    [method, msg] = message.data.split(/\\(.+)/)
    msg=JSON.parse(msg);
    switch(method){
        case"log":
            if(msg.log)
                console.log(msg.log);
            if(msg.alert)
                alert(msg.alert);
            break;
        case"mainUpdate":
            const time = performance.now();
            const dT = time-lastT;
            lastT = time;
            var hX = gameCanvas.width/(2*tileSize)-0.5;
            var hY = gameCanvas.height/(2*tileSize)-0.5;
            ctx.fillStyle='#3DAF45'
            ctx.fillRect(0,0,gameCanvas.width,gameCanvas.height,);
            localPlayer = msg.lp;
            ctx.font = "0.5pt Arial";

            //TODO:     only draw tiles in screen      
            //TODO:     seperate painting and updating with client physics
            for(let num in map){
                var chunk = map[num];
                if(chunk){
                    var worldX=chunk.mapX*realmCtx.chunkSize;
                    var worldY=chunk.mapY*realmCtx.chunkSize;
                    var screenX = worldX-localPlayer.x+hX;
                    var screenY = worldY-localPlayer.y+hY;
                    for (let i = 0; i < chunk.tiles.length; i++) {
                        const t = chunk.tiles[i];
                        const x = i%realmCtx.chunkSize; 
                        const y = (i-x)/realmCtx.chunkSize; 
                        const drawX = screenX+x;
                        const drawY = screenY+y;
                        ctx.drawImage(tiles,(t.style%19)*16,0,16,16,drawX,drawY,1,1);
                        ctx.fillStyle='#512121';
                        ctx.fillText(t.height,drawX,drawY+1,1);
                        if(t.lit || t.col){
                            ctx.lineWidth  =0.1;
                            ctx.strokeStyle=t.col?'#fe1313':'#45ff77';
                            ctx.beginPath();
                            ctx.moveTo(drawX,drawY+1);
                            ctx.lineTo(drawX+1,drawY);
                            ctx.moveTo(drawX+1,drawY+1);
                            ctx.lineTo(drawX,drawY);
                            ctx.stroke();
                            t.lit=false;
                            t.col=false;
                        }
                    }
                    ctx.lineWidth  =0.5;
                    ctx.strokeStyle='#fe1313';
                    ctx.beginPath();
                    ctx.moveTo(screenX,screenY);
                    ctx.lineTo(screenX+realmCtx.chunkSize,screenY);
                    ctx.lineTo(screenX+realmCtx.chunkSize,screenY+realmCtx.chunkSize);
                    ctx.stroke();
                    ctx.fillStyle='#f1f1f1';
                    ctx.fillText(chunk.num+'('+worldX+','+worldY+')',screenX,screenY);
                }else
                console.log('null chunk: ',num);
            }
            ctx.fillStyle='#ff1111';
            ctx.fillText("Delta T:"+dT+"\nMSG: "+JSON.stringify(msg),1,1);
            ctx.fillStyle='#1144ff';
            for(let i in msg.es){
                const entity=msg.es[i];
                const x = hX+entity.x-localPlayer.x;
                const y= hY+entity.y-localPlayer.y;
                ctx.drawImage(playerTiles,0,0,16,16,x,y,1,1);
                ctx.fillText("E-"+entity.height,x,y);
            }
            ctx.fillStyle='#11ff22';
            ctx.drawImage(playerTiles,0,0,16,32,hX,hY-1,1,2);
            ctx.fillText("("+localPlayer.x+","+localPlayer.y+")"+localPlayer.height,hX,hY);
            ctx.fillStyle='#eeff22';
            ctx.arc(hX,hY,0.5, 0, tau);
            ctx.fillStyle='#4477ff';
            ctx.fillRect(0,0,gameCanvas.width,64/tileSize);
            break;
        case"realmCtx":
            realmCtx=msg;
            console.log('realm ctx: '.realmCtx);
            break;
        case"lite":
            map[msg.chunk].tiles[msg.tile].lit=true;
            break;
        case"col":
            map[msg.chunk].tiles[msg.tile].col=true;
            break;
        case"chunkDump":
            const range = 1
            console.log('*took dump of chunks:',msg);
            var mapX=Math.floor(localPlayer.x/realmCtx.chunkSize);
            var mapY=Math.floor(localPlayer.y/realmCtx.chunkSize);
            var cl = Clamp(mapX-range,0,realmCtx.mapWidth-1);
            let cr = Clamp(mapX+range,0,realmCtx.mapWidth-1);
            let ct = Clamp(mapY-range,0,realmCtx.mapHeight-1);
            let cb = Clamp(mapY+range,0,realmCtx.mapHeight-1);
            var newMap={};
            for (const [_, c] of Object.entries(msg)) {
                if(c!==null)
                    newMap[c.num]=c;
            }
            var txt="";
            for(;cl <= cr; cl++) {
                for(let j=ct; j <= cb; j++) {
                    let i = j*realmCtx.mapWidth+cl;
                    if(i in map){
                        newMap[i]=map[i];
                        console.log('reusing chunk#'+i);
                        txt+=newMap[i].num+',';
                    }
                    else{
                        txt+='#,';
                    }
                }
                txt+='\n';
            }
            console.log(txt);
            map=newMap;
    }
};

function WorldToScreen(x,y){
    return x-localPlayer.x+hX, y-localPlayer.x+hX;
}

function vpToMap(v){
    return v/(tileSize*realmCtx.chunkSize);
}

function vpToMap(x,y){
    const d = tileSize*realmCtx.chunkSize
    return x / d, y / d;
}

function wsMessege(method,data){
    const msg = method+'\\'+JSON.stringify(data)
    ws.send(msg);
}

window.addEventListener("keydown", function (event) {
    if(!event.repeat){
        const k = event.key;
        if(k in inputMap){
            wsMessege('input',{b:inputMap[k],h:true})
        }
        switch(event.key){
            case"h":
                overlay.hidden=!overlay.hidden;
                break

        }
    }
});

window.addEventListener("keyup", function (event) {
    const k = event.key;
    if(k in inputMap){
        wsMessege('input',{b:inputMap[k],h:false})
    }
});

const inputMap={
    'w':'u',
    's':'d',
    'a':'l',
    'd':'r'
}

function Clamp(v,min, max) {
    return Math.min(Math.max(v, min), max);
};
