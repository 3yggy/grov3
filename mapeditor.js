var gameCanvas, ctx,tiles, map=[];
window.onload=function(){
    gameCanvas = document.getElementById('editorCanvas');
    ctx = gameCanvas.getContext('2d');
    gameCanvas.onwheel = function(e){
        console.log(e.deltaY);
        sizeTile(tileSize+e.deltaY*-0.05);
    }
    tiles = new Image(  )
    tiles.src = 'tiles0.png';
    New();
    tiles.onload=Draw;
    var overlay = document.getElementById('editor');

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
    
    gameCanvas.addEventListener('mousedown', Mouse);
    gameCanvas.oncontextmenu=function(){return false}
}

var object;
var copyTile = {
    style:0,
    col:8,
    height:1,
}

function Mouse(evt) {    
    const c = ClientToWorld(evt.clientX,evt.clientY)
    var worldX=c.x;
    var worldY=c.y;
    //console.log(worldX,worldY);
    var tile = map[0].tiles[worldX+worldY*realmCtx.chunkSize]
    
    if(!evt.ctrlKey&&!evt.shiftKey){
        if(evt.button === 0){
            tile.style=copyTile.style;
            tile.col=copyTile.col;
            tile.height=copyTile.height;
        }else{
            copyTile=tile;
        }
    }else{
        if(!evt.shiftKey){
            object = "col";
        }else if(!evt.ctrlKey){
            object = "style";
        }else{
            object = "height";
        }

        if(tile[object]!=null){
            console.log(evt);
            if(evt.button == 0) 
            {
                tile[object]++;
            }else{
                tile[object]--;
            }
            console.log(tile[object]);
        }
    }
    Draw();
}

function New(){
    realmCtx = {chunkSize:16};
    chunk = {};
    chunk.mapX=0;
    chunk.mapY=0;
    chunk.tiles=[];
    for (let i = 0; i < realmCtx.chunkSize*realmCtx.chunkSize; i++) {
        chunk.tiles[i]={
            style:0,
            col:8,
            height:1,
        }
    }
    map[0]=chunk;
    Draw();
}

var viewX=8;
var viewY=8;
window.showCol=true;
window.showHeight=true;
function Draw(){
    ctx.font = "0.5pt Arial";
    ctx.fillStyle='#777777'
    ctx.fillRect(0,0,gameCanvas.width,gameCanvas.height);
    var hX = gameCanvas.width/(2*tileSize)-0.5;
    var hY = gameCanvas.height/(2*tileSize)-0.5;
    ctx.fillStyle='#3DAF45'
    for (let i = 0; i < map.length; i++) {
        var chunk = map[i];
        var worldX=chunk.mapX*realmCtx.chunkSize;
        var worldY=chunk.mapY*realmCtx.chunkSize;
        var screenX = worldX-viewX+hX;
        var screenY = worldY-viewY+hY;
        ctx.fillRect(screenX,screenY,realmCtx.chunkSize,realmCtx.chunkSize);
        for (let j = 0; j < chunk.tiles.length; j++) {
            const t = chunk.tiles[j];
            const x = j%realmCtx.chunkSize; 
            const y = (j-x)/realmCtx.chunkSize; 
            const drawX = screenX+x;
            const drawY = screenY+y;
            ctx.drawImage(tiles,(t.style)*16,0,16,16,drawX,drawY,1,1);
            if(window.showHeight){
                ctx.fillStyle='#512121';
                ctx.fillText(t.height,drawX,drawY+1,1);
            }
            if(window.showCol&&t.col!=8){
                ctx.lineWidth  =0.06;
                ctx.strokeStyle='#1e33e3';
                ctx.beginPath();
                switch(t.col){
                    case 9:
                        ctx.moveTo(drawX,drawY);
                        ctx.lineTo(drawX+1,drawY);
                        ctx.lineTo(drawX+1,drawY+1);
                        ctx.lineTo(drawX,drawY+1);
                        ctx.lineTo(drawX,drawY);
                        break;
                    case 11:
                        ctx.moveTo(drawX+0.2,drawY+0.2);
                        ctx.lineTo(drawX+0.8,drawY+0.2);
                        ctx.lineTo(drawX+0.8,drawY+0.8);
                        ctx.lineTo(drawX+0.2,drawY+0.8);
                        ctx.lineTo(drawX+0.2,drawY+0.2);
                        break;
                    case 0: ctx.strokeStyle='#1ef353'; case 4:
                        ctx.moveTo(drawX,drawY);
                        ctx.lineTo(drawX,drawY+1);
                        ctx.lineTo(drawX+1,drawY+1);
                        ctx.lineTo(drawX,drawY);
                        break;
                    case 2:ctx.strokeStyle='#1ef353'; case 6:
                        ctx.moveTo(drawX,drawY);
                        ctx.lineTo(drawX+1,drawY);
                        ctx.lineTo(drawX+1,drawY+1);
                        ctx.lineTo(drawX,drawY);
                        break;
                    case 1: ctx.strokeStyle='#1ef353';case 5:
                        ctx.moveTo(drawX+1,drawY);
                        ctx.lineTo(drawX+1,drawY+1);
                        ctx.lineTo(drawX,drawY+1);
                        ctx.lineTo(drawX+1,drawY);
                        break;
                    case 3:ctx.strokeStyle='#1ef353'; case 7:
                        ctx.moveTo(drawX+1,drawY);
                        ctx.lineTo(drawX,drawY+1);
                        ctx.lineTo(drawX,drawY);
                        ctx.lineTo(drawX+1,drawY);
                        break;
                }
                ctx.stroke();
            }
        }
    }
}

function ClientToWorld(x,y){
    var hX = gameCanvas.width/(2*tileSize)-0.5;
    var hY = gameCanvas.height/(2*tileSize)-0.5;
    var rect = gameCanvas.getBoundingClientRect();
    sx= x - rect.left
    sy= y - rect.top
    
    return {x:Math.floor( sx/tileSize-hX+viewX),y:Math.floor(sy/tileSize-hY+viewY)};
}

function Save(){
    document.cookie= "m="+JSON.stringify(map);
    console.log(encodeURIComponent(JSON.stringify(map)));
}

function Load(string){
    map=JSON.parse(decodeURIComponent(string));
    Draw();
    
}

function SpewTest(){
    let tiles = map[0].tiles;
    var cols="new byte[] {\n    "
    var styles ="new byte[] {\n    "
    var heights = "new byte[] {\n    "
    for (let i = 0; i < tiles.length;i++){
        const t = tiles[i];
        cols+=t.col+',';
        styles+=t.style+',';
        heights+=t.height+',';

        if(((i+1)%realmCtx.chunkSize)==0)
        {
            cols+=   '\n    ';
            styles+= '\n    ';
            heights+='\n    ';
        }
    }
    cols+='};';
    styles+='};';
    heights+='};';
    console.log('Coliders:\n',cols);
    console.log('styles:\n',styles);
    console.log('heights:\n',heights);
}

var tileSize = 16;
function sizeTile(s){
    if(s<8)
        s=8;
    tileSize=s;
    ctx.resetTransform();
    ctx.scale(s,s);
    ctx.imageSmoothingEnabled=false;
    if(realmCtx)
    Draw();
}
