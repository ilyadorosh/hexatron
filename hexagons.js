// neighbour
// graph search
// usa map load
// generate random hexagon array, save

class OffsetClass {
    constructor(row, col) {
        this.row = rows;
        this.col = col;
    }
    equals (obj) { 
        return (obj instanceof OffsetClass) &&
            (obj.row === this.row) && (obj.col === this.col); 
    };

}

    var canvas = document.getElementById('hexmap');
    var hexHeight,
        hexRadius,
        hexRectangleHeight,
        hexRectangleWidth,
        hexagonAngle = 0.523598776, // 30 degrees in radians
        sideLength = 60,
        boardWidth = 9,
        boardHeight = 9,

        size, origin, M,
        rect,

        action = "begin", 
        patt=new Array(boardHeight),
        begin = OffsetCoord(7,5),
        beginc = roffset_to_cube(-1,begin),
        end, endc,
        path=[],
        board=[],
        mySet = new Set();

    //MMMMMMMMMMMMMMMMMM MAP GENERATION
    function createObstacles() {
        var n = 10,
            obstacles=[];
        
        for(i = 0; i < boardWidth; ++i) {
            let newrow=new Array(boardHeight)
            for(j = 0; j < boardHeight; ++j) {
                if(  Math.floor(3*boardWidth/2)<=(i+j) || 
                       (i+j) <Math.floor(boardWidth/2) ){
                    newrow[j]=0
                } else {
                    newrow[j]=Math.floor(0.4+Math.random()*1.599)
                }
            }
            patt[i]=newrow;
        }
        //console.log( "patt", patt)



        //console.log(obstacles)
        for (; n > 0; n -= 1) {
            obstacles.push([Math.floor(Math.random() * boardWidth),
                                        Math.floor(Math.random() * boardHeight)]);
            //mySet.add(new OffsetClass(Math.floor(Math.random() * boardWidth),
            //                          Math.floor(Math.random() * boardHeight)) );
        }
        return obstacles;
    }    
    var obstacles = createObstacles();

    //HHHHH HEX SIZES
    hexHeight = Math.sin(hexagonAngle) * sideLength;
    hexRadius = Math.cos(hexagonAngle) * sideLength;
    hexRectangleHeight = sideLength + 2 * hexHeight;
    hexRectangleWidth = 2 * hexRadius;

    rect = canvas.getBoundingClientRect();
    size = new Point(hexRadius, hexHeight + sideLength);
    origin = new Point(0,0)//rect.left, rect.top);

    if (canvas.getContext){
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "#ffa0ff";
        ctx.strokeStyle = "#ffCCCC";
        ctx.lineWidth = 4;
        drawBoard(ctx, boardWidth, boardHeight);

        canvas.addEventListener("mousemove", function(eventInfo) {
            var x,
                y,
                hexX,
                hexY,
                screenX,
                screenY;

            x = eventInfo.clientX - rect.left;
            y = eventInfo.clientY - rect.top;
            // PIXEL TO HEX 
            hexY = Math.floor(y / (hexHeight + sideLength));
            hexX = Math.floor((x - (hexY % 2) * hexRadius) / hexRectangleWidth);
            screenX = hexX * hexRectangleWidth + ((hexY % 2) * hexRadius);
            screenY = hexY * (hexHeight + sideLength);
            var touched = OffsetCoord(hexX, hexY);
            var touchedc = roffset_to_cube(-1,touched)
            //if(patt[touchedc.r][touchedc.q]===1 ){
                if(action === "begin"){
                    beginc = touchedc
                    drawHexagon(ctx, screenX, screenY, true);
                    action = "end"
                    console.log("succ",getSuccessors(beginc)) 
                } else{
                    endc = touchedc
                    path = hex_linedraw(beginc, endc);
                    var way = astar (beginc, endc, {id, isGoal, getSuccessors ,distance, estimate})
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    drawBoard(ctx, boardWidth, boardHeight);
                    drawPath(ctx, way);
                    console.log("path/way",way)
                    let next = hex_neighbor(endc, 3)
                    let nextOff = roffset_from_cube(-1, next)
                    let xy = offsetToPixel(nextOff)
                    //drawHexagon(ctx, xy.x, xy.y, true);
                }
            //}

            // Check if the mouse's coords are on the board
            if(hexX >= 0 && hexX < boardWidth) {
                if(hexY >= 0 && hexY < boardHeight) {
                    ctx.fillStyle = "#00fa00";
                    drawHexagon(ctx, screenX, screenY, true);
                }
            }
        });

    }
    
    function Point(x, y) {
        return {x: x, y: y};
    }

    function Hex(q, r, s) {
        if (Math.round(q + r + s) !== 0) throw "q + r + s must be 0";
        return {q: q, r: r, s: s};
    }

    function hex_add(a, b)
    {
        return Hex(a.q + b.q, a.r + b.r, a.s + b.s);
    }

    function hex_subtract(a, b)
    {
        return Hex(a.q - b.q, a.r - b.r, a.s - b.s);
    }

    function hex_length(hex)
    {
        return (Math.abs(hex.q) + Math.abs(hex.r) + Math.abs(hex.s)) / 2;
    }

    function hex_distance(a, b)
    {
        return hex_length(hex_subtract(a, b));
    }

    function hex_round(h)
    {
        var qi = Math.round(h.q);
        var ri = Math.round(h.r);
        var si = Math.round(h.s);
        var q_diff = Math.abs(qi - h.q);
        var r_diff = Math.abs(ri - h.r);
        var s_diff = Math.abs(si - h.s);
        if (q_diff > r_diff && q_diff > s_diff)
        {
            qi = -ri - si;
        }
        else
            if (r_diff > s_diff)
            {
                ri = -qi - si;
            }
            else
            {
                si = -qi - ri;
            }
        return Hex(qi, ri, si);
    }

    function hex_lerp(a, b, t)
    {
        return Hex(a.q * (1.0 - t) + b.q * t, a.r * (1.0 - t) + b.r * t, a.s * (1.0 - t) + b.s * t);
    }

    function hex_linedraw(a, b)
    {
        var N = hex_distance(a, b);
        var a_nudge = Hex(a.q + 0.000001, a.r + 0.000001, a.s - 0.000002);
        var b_nudge = Hex(b.q + 0.000001, b.r + 0.000001, b.s - 0.000002);
        var results = [];
        var step = 1.0 / Math.max(N, 1);
        for (var i = 0; i <= N; i++)
        {
            results.push(hex_round(hex_lerp(a_nudge, b_nudge, step * i)));
        }
        return results;
    }

    var hex_directions = [Hex(1, 0, -1), Hex(1, -1, 0), Hex(0, -1, 1), Hex(-1, 0, 1), Hex(-1, 1, 0), Hex(0, 1, -1)];

    function hex_direction(direction)
    {
        return hex_directions[direction];
    }

    function hex_neighbor(hex, direction)
    {
        return hex_add(hex, hex_direction(direction));
    }



    function OffsetCoord(col, row) {
        return {col: col, row: row};
    }


    function hexToPixel(h) {
        var x = 0 
        var y = h.r * size.y;
        return new Point(x + origin.x, y + origin.y);
    }
    function pixelToHex(p) {
        var pt = new Point((p.x - origin.x) / size.x, (p.y - origin.y) / size.y);
        var q = 0
        var r =0 
        return new Hex(q, r, -q - r);
    }

    function offsetToPixel(oc) {
        let i=oc.col;
        let j=oc.row;
        let x = i * hexRectangleWidth + ((j % 2) * hexRadius);
        let y = j * (sideLength + hexHeight);
        return Point(x, y);
    }

    var EVEN = 1;
    var ODD = -1;

    function roffset_from_cube(offset, h)
    {
        var col = h.q + (h.r + offset * (h.r & 1)) / 2;
        var row = h.r;
        return OffsetCoord(col, row);
    }

    function roffset_to_cube(offset, h) {
        var q = h.col - (h.row + offset * (h.row & 1)) / 2;
        var r = h.row;
        var s = -q - r;
        return Hex(q, r, s);
    }

    function drawBoard(canvasContext, width, height) {
        var i,
            j;
        for(i = 0; i < width; ++i) {
            for(j = 0; j < height; ++j) {
                //let p = hexToPixel(Hex(j,i,-j-i));
                let p = offsetToPixel(roffset_from_cube(-1, Hex(j,i,-j-i) ));
                //if(mySet.has(OffsetClass(i,j)) ){
                if(patt[i][j]===1 ){
                    drawHexagon(ctx, p.x, p.y,false);
                }
                canvasContext.fillText('q='+j+ ' r='+i, p.x+20, p.y+40);
            }
        }
    }

    function drawPath(canvasContext, path) {
        path.forEach(function(pointc) {
            point = roffset_from_cube(-1, pointc);
                drawHexagon(
                    ctx, 
                    point.col * hexRectangleWidth + ((point.row % 2) * hexRadius), 
                    point.row * (sideLength + hexHeight), 
                    true
                );
        });
    }

    function drawHexagon(canvasContext, x, y, fill) { 
        var fill = fill || false;
        canvasContext.beginPath();
        canvasContext.moveTo(x + hexRadius, y);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight);
        canvasContext.lineTo(x + hexRectangleWidth, y + hexHeight + sideLength);
        canvasContext.lineTo(x + hexRadius, y + hexRectangleHeight);
        canvasContext.lineTo(x, y + sideLength + hexHeight);
        canvasContext.lineTo(x, y + hexHeight);
        canvasContext.closePath();
        if(fill) {
        ctx.fillStyle = "#eeeeaa";
        } else {
        ctx.fillStyle = "#aaccaa";
           // canvasContext.stroke();
        }
        canvasContext.fill();

        ctx.fillStyle = "#cceecc";
        ctx.fillText('x='+x.toFixed(2)+' y='+y.toFixed(2), x, 30+y);
    }


    document.getElementById('reset').onclick = function() {
        action='begin';
    }

    document.getElementById('import').onclick = function() {
      var files = document.getElementById('selectFiles').files;
      console.log(files);
      if (files.length <= 0) {
          return false;
      }

      var fr = new FileReader();

      fr.onload = function(e) { 
          console.log(e);
          var result = JSON.parse(e.target.result);
          console.log(result);
          patt = result
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBoard(ctx, boardWidth, boardHeight);
          var formatted = JSON.stringify(result, null, 2);
          document.getElementById('result').value = formatted;
      }

      fr.readAsText(files.item(0));
    };

    function download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
    }
    document.getElementById('download').onclick = function() {
        let jsonData = JSON.stringify(patt)
        download(jsonData, 'json.txt', 'text/plain');
    }

function astar (start, goal, {id, isGoal, getSuccessors, distance, estimate}) {
  const priorityQueue = [start]  // TODO: Should we use BinaryHeap?
  const closed = new Set()
  const parents = new Map()
  const gScore = new Map()
  const fScore = new Map()
  let node = null

  gScore.set(id(start), 0)
  fScore.set(id(start), estimate(start, goal))

  while (priorityQueue[0] || priorityQueue.length) {
    console.log("openque",priorityQueue)
    node = priorityQueue.shift()

    if (closed.has(id(node))) {
      continue
    }
    if (isGoal(node)) {
      break // backtrace from here
    }
    closed.add(id(node))

    for (let child of getSuccessors(node)) {
      if (closed.has(id(child))) {
        continue
      }
      priorityQueue.push(child)

      // The distance from start to a child
      const tentativeGScore = gScore.get(id(node)) + distance(node, child)
      const childGScore = gScore.has(id(child)) ? gScore.get(id(child)) : Infinity

      // This is not a better path
      if (tentativeGScore >= childGScore) {
        continue
      }
      // This path is the best until now. We should save it.
      parents.set(id(child), node)
      gScore.set(id(child), tentativeGScore)

      const childFScore = tentativeGScore + estimate(child, goal)
      fScore.set(id(child), childFScore)
    }

    priorityQueue.sort((a, b) => fScore.get(id(a)) - fScore.get(id(b)))
  }

  const path = []
  while (node) {
    path.push(node)
    node = parents.get(id(node))
  }
  return path.reverse()
}

function id(h){return hash = ( h.q << 16 ) ^ h.r; }

isGoal=(h) => (0 === hex_distance(h, endc))

var distance = hex_distance
var estimate = hex_distance

getSuccessors = function (h) {
    let results =[]
    for (var i = 0; i < 6; i++){
        let hex = hex_neighbor(h, i)
        if(patt[hex.r][hex.q]===1 ){
            results.push(hex);
        }
    }
    return results;
}

//function estimate (h, endc){return  h.a}


function search (graph, start, end, options) {
/* 
    graph.cleanDirty();
    options = options || {};
    var heuristic = options.heuristic || astar.heuristics.manhattan;
    var closest = options.closest || false;

    var openHeap = getHeap();
    var closestNode = start; 

    start.h = heuristic(start, end);
    graph.markDirty(start);

    openHeap.push(start);

    while (openHeap.size() > 0) {

      var currentNode = openHeap.pop();

      if (currentNode === end) {
        return pathTo(currentNode);
      }

      currentNode.closed = true;

      var neighbors = graph.neighbors(currentNode);

      for (var i = 0, il = neighbors.length; i < il; ++i) {
        var neighbor = neighbors[i];

        if (neighbor.closed || neighbor.isWall()) {
          continue;
        }

        var gScore = currentNode.g + neighbor.getCost(currentNode);
        var beenVisited = neighbor.visited;

        if (!beenVisited || gScore < neighbor.g) {

          neighbor.visited = true;
          neighbor.parent = currentNode;
          neighbor.h = neighbor.h || heuristic(neighbor, end);
          neighbor.g = gScore;
          neighbor.f = neighbor.g + neighbor.h;
          graph.markDirty(neighbor);
          if (closest) {
            if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
              closestNode = neighbor;
            }
          }

          if (!beenVisited) {
            openHeap.push(neighbor);
          } else {
            openHeap.rescoreElement(neighbor);
          }
        }
      }
    }

    if (closest) {
      return pathTo(closestNode);
    }

    // No result was found - empty array signifies failure to find path.
    return [];
*/
  }
/*
  // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
  heuristics: {
    manhattan: function(pos0, pos1) {
      var d1 = Math.abs(pos1.x - pos0.x);
      var d2 = Math.abs(pos1.y - pos0.y);
      return d1 + d2;
    },
*/
