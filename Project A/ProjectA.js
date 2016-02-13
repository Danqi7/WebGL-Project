// HelloCube.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = v_Color;\n' +
  '}\n';

var ANGLE_STEP = 45.0;
var g_joint1Angle = 0.0;
var g_arm1Angle = 0.0;
var extra_angle = 0.0;
var mousemove;

// Global vars for mouse click-and-drag for rotation.
var isDrag=false;   // mouse-drag: true when user holds down mouse button
var xMclik=0.0;     // last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;  // total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;   

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) 
  {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) 
  {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex coordinates and color
  var n = initVertexBuffers(gl);
  if (n < 0) 
  {
    console.log('Failed to set the vertex information');
    return;
  }


  canvas.onmousedown  = function(ev){myMouseDown( ev, gl, canvas) }; 
  canvas.onmousemove =  function(ev){myMouseMove( ev, gl, canvas) };         
  canvas.onmouseup =    function(ev){myMouseUp  (   ev, gl, canvas)};

  window.addEventListener("keydown", myKeyDown, false);
  window.addEventListener("keyup", myKeyUp, false);
  window.addEventListener("keypress", myKeyPress, false);

  // Set clear color and enable hidden surface removal
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Get handle to graphics system's storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) 
  { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Create a local version of our model matrix in JavaScript 
  var modelMatrix = new Matrix4();
  // Create, init current rotation angle value in JavaScript
  var currentAngle = 0.0;


  // Start drawing: create 'tick' variable whose value is this function:
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw shapes
    requestAnimationFrame(tick, canvas);   
  };
  tick();             // start (and continue) animation: draw current image
}

function initVertexBuffers(gl) 
{
  /// Create a rec cube with width 0.5, length 1
  //    v6----- v5
  //   /|      /|
  //  v1------v0|
  //  | |     | |
  //  | |v7---|-|v4
  //  |/      |/
  //  v2------v3
  var verticesColors = new Float32Array([
    // Vertex coordinates and color
    //====Robot Arm======
     0.25,   0.50,   0.25,     1.0,  1.0,  1.0,  // v0 White
    -0.25,   0.50,   0.25,     1.0,  0.0,  1.0,  // v1 Magenta
    -0.25,  -0.50,   0.25,     1.0,  0.0,  0.0,  // v2 Red
     0.25,  -0.50,   0.25,     1.0,  1.0,  0.0,  // v3 Yellow
     0.25,  -0.50,  -0.25,     0.0,  1.0,  0.0,  // v4 Green
     0.25,   0.50,  -0.25,     0.0,  1.0,  1.0,  // v5 Cyan
    -0.25,   0.50,  -0.25,     0.0,  0.0,  1.0,  // v6 Blue
    -0.25,  -0.50,  -0.25,     0.0,  0.0,  0.0,   // v7 Black


    //===Cylinder===
     0.00,   1.00,   0.00,      1.0,  1.0,  1.0,  // v8 White
    -0.25,   1.00,   0.433,     1.0,  0.0,  1.0,  // v9 Magenta
     0.25,   1.00,   0.433,     1.0,  0.0,  0.0,  // v10 Red
     0.50,   1.00,   0.00,      1.0,  1.0,  0.0,  // v11 Yellow
     0.25,   1.00,  -0.433,     0.0,  1.0,  0.0,  // v12 Green
    -0.25,   1.00,  -0.433,     0.0,  1.0,  1.0,  // v13 Cyan
    -0.50,   1.00,   0.00,      0.0,  0.0,  1.0,  // v14 Blue

     0.00,  -1.00,   0.00,      1.0,  1.0,  1.0,  // v15 White
    -0.25,  -1.00,   0.433,     1.0,  0.0,  1.0,  // v16 Magenta
     0.25,  -1.00,   0.433,     1.0,  0.0,  0.0,  // v17 Red
     0.50,  -1.00,   0.00,      1.0,  1.0,  0.0,  // v18 Yellow
     0.25,  -1.00,  -0.433,     0.0,  1.0,  0.0,  // v19 Green
    -0.25,  -1.00,  -0.433,     0.0,  1.0,  1.0,  // v20 Cyan
    -0.50,  -1.00,   0.00,      0.0,  0.0,  1.0,  // v21 Blue

    //===Star Base====
     0.0,  0.5, 0.0,  1.0,  1.0,  1.0, //v22
     0.2,  0.3, 0.0,  1.0,  0.0,  1.0, //v23
     0.5,  0.3, 0.0,  1.0,  0.0,  0.0, //v24
     0.3,  0.0, 0.0,  1.0,  1.0,  0.0, //v25
     0.5, -0.3, 0.0,  0.0,  1.0,  0.0, //v26
     0.2, -0.3, 0.0,  0.0,  1.0,  1.0, //v27
     0.0, -0.5, 0.0,  0.0,  0.0,  1.0, //v28
    -0.2, -0.3, 0.0,  1.0,  1.0,  1.0, //v29
    -0.5, -0.3, 0.0,  1.0,  0.0,  1.0, //v30
    -0.3,  0.0, 0.0,  1.0,  0.0,  0.0, //v31
    -0.5,  0.3, 0.0,  1.0,  1.0,  0.0, //v32
    -0.2,  0.3, 0.0,  0.0,  1.0,  0.0, //v33

     0.0,  0.5, -0.5,  1.0,  1.0,  1.0, //v34
     0.2,  0.3, -0.5,  1.0,  0.0,  1.0, //v35
     0.5,  0.3, -0.5,  1.0,  0.0,  0.0, //v36
     0.3,  0.0, -0.5,  1.0,  1.0,  0.0, //v37
     0.5, -0.3, -0.5,  0.0,  1.0,  0.0, //v38
     0.2, -0.3, -0.5,  0.0,  1.0,  1.0, //v39
     0.0, -0.5, -0.5,  0.0,  0.0,  1.0, //v40
    -0.2, -0.3, -0.5,  1.0,  1.0,  1.0, //v41
    -0.5, -0.3, -0.5,  1.0,  0.0,  1.0, //v42
    -0.3,  0.0, -0.5,  1.0,  0.0,  0.0, //v43
    -0.5,  0.3, -0.5,  1.0,  1.0,  0.0, //v44
    -0.2,  0.3, -0.5,  0.0,  1.0,  0.0, //v45

  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    0, 3, 4,   0, 4, 5,    // right
    0, 5, 6,   0, 6, 1,    // up
    1, 6, 7,   1, 7, 2,    // left
    7, 4, 3,   7, 3, 2,    // down
    4, 7, 6,   4, 6, 5,     // back



     8,  9, 10, 11, 12, 13, 14,  9,    // top fan
    15, 16, 17, 18, 19, 20, 21, 16,    // bottom fan 
    
    10,  9, 16,  10, 16, 17,  // front
    11, 10, 17,  11, 17, 18, // front right   
     9, 14, 21,   9, 21, 16,    // front left
  
    12, 13, 20, 12, 20, 19, // back      
    11, 12, 19, 11, 19, 18,// back right   
    13, 14, 21, 13, 21, 20,// back left

    //top fan
    22, 23, 33, //fan1
    23, 24, 25, //fan2
    25, 26, 27, //fan3
    27, 28, 29, //fan4
    29, 30, 31, //fan5
    31, 32, 33, //fan6
    //bottom fan
    34, 35, 45, //fan1
    35, 36, 37, //fan2
    37, 38, 39, //fan3
    39, 40, 41, //fan4
    41, 42, 43, //fan5
    43, 44, 45, //fan6

    33, 22, 34,  33, 34, 45, //#1
    22, 23, 35,  22, 35, 34, //#2
    24, 23, 35,  24, 35, 36, //#3
    25, 24, 36,  25, 36, 37, //#4
    26, 25, 37,  26, 37, 38, //#5
    27, 26, 38,  27, 38, 39, //#6
    28, 27, 39,  28, 39, 40, //#7
    28, 29, 41,  28, 41, 40, //#8
    29, 30, 42,  29, 42, 41, //#9
    30, 31, 43,  30, 43, 42, //#10
    31, 32, 44,  31, 44, 43, //#11
    33, 32, 44,  33, 44, 45, //#12



 ]);

 // Create a buffer object
  var vertexColorBuffer = gl.createBuffer();
  var indexBuffer = gl.createBuffer();
  if (!vertexColorBuffer || !indexBuffer) 
  {
    return -1;
  }

  // Write the vertex coordinates and color to the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, verticesColors, gl.STATIC_DRAW);

  var FSIZE = verticesColors.BYTES_PER_ELEMENT;
  // Assign the buffer object to a_Position and enable the assignment
  var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_Position < 0) 
  {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, FSIZE * 6, 0);
  gl.enableVertexAttribArray(a_Position);
  // Assign the buffer object to a_Color and enable the assignment
  var a_Color = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_Color < 0) 
  {
    console.log('Failed to get the storage location of a_Color');
    return -1;
  }
  gl.vertexAttribPointer(a_Color, 3, gl.FLOAT, false, FSIZE * 6, FSIZE * 3);
  gl.enableVertexAttribArray(a_Color);

  // Write the indices to the buffer object
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) 
{
  console.log(n);
  // Clear <canvas>  colors AND the depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  //=====================Robotic Arm=====================
  modelMatrix.setTranslate(-0.5,0.2,0.0);
  modelMatrix.scale(0.5,0.5,-0.5);
  modelMatrix.rotate(50, 1,0,0);
  modelMatrix.rotate(currentAngle+extra_angle, 0,1,0); 
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw base
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);

  //modelMatrix.setRotate(currentAngle * 0.8, 0,1,0);
  modelMatrix.translate(0.0,1.0,0.0);
  modelMatrix.scale(0.8,1.0,0.8);
  modelMatrix.translate(0.0,-0.123,0.0);
  modelMatrix.rotate(currentAngle*0.18, 1,0,0);
  modelMatrix.rotate(g_joint1Angle, 1,0,0);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
 // Draw  upper arm
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);

  pushMatrix(modelMatrix);

  //===right part===
  modelMatrix.rotate(-25,0.0,0.0,1.0);
  modelMatrix.translate(-0.1,0.65,0.0);
  modelMatrix.scale(0.35,0.35,0.35);
  modelMatrix.rotate(currentAngle*0.25, 0,0,1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);

  modelMatrix.rotate(45,0.0,0.0,1.0);
  modelMatrix.translate(0.3,0.85,0.0);
  //modelMatrix.scale(0.8,0.8,0.8);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);

  modelMatrix = popMatrix();
  

  //===left part===
  modelMatrix.rotate(25,0.0,0.0,1.0);
  modelMatrix.translate(0.1,0.65,0.0);
  modelMatrix.scale(0.35,0.35,0.35);
  modelMatrix.rotate(-currentAngle*0.25, 0,0,1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);

  modelMatrix.rotate(-45,0.0,0.0,1.0);
  modelMatrix.translate(-0.3,0.85,0.0);
  //modelMatrix.scale(0.8,0.8,0.8);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  // Draw
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 0);







  //================Cyclinder==================

  modelMatrix.setTranslate(0.3,-0.5,0.0);
  modelMatrix.scale(0.3,0.3,-0.3);
  modelMatrix.rotate(20, 1,0,0);
  modelMatrix.rotate(currentAngle, 0,1,0);
  
  var dist = Math.sqrt(xMdragTot*xMdragTot + yMdragTot*yMdragTot);
  modelMatrix.rotate(dist*120.0, -yMdragTot+0.0001, xMdragTot+0.0001, 0.0);
  
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //draw
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 36);
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 44);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 52);

  

  modelMatrix.rotate(90, 0,0,1);
  modelMatrix.scale(1.0,2.0,1.0);
  modelMatrix.translate(0.35,0.00,0.0);
  modelMatrix.rotate(currentAngle*0.43, 0,0,1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //draw
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 36);
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 44);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 52);

  pushMatrix(modelMatrix);

  modelMatrix.rotate(-90, 0,0,1);
  modelMatrix.translate(-0.5,0.7,0);
  modelMatrix.scale(0.5,1,1);
  modelMatrix.scale(0.3,0.3,0.3);
  modelMatrix.rotate(currentAngle*0.39, 0,0,1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //draw
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 36);
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 44);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 52);


  modelMatrix.rotate(90,1,0,0);
  modelMatrix.translate(0.0,0.0,-0.6);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //draw
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 36);
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 44);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 52);

  modelMatrix = popMatrix();

  modelMatrix.rotate(-90, 0,0,1);
  modelMatrix.translate(0.5,0.7,0);
  modelMatrix.scale(0.5,1,1);
  modelMatrix.scale(0.3,0.3,0.3);
  modelMatrix.rotate(currentAngle*0.39, 0,0,1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //draw
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 36);
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 44);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 52);


  modelMatrix.rotate(90,1,0,0);
  modelMatrix.translate(0.0,0.0,-0.6);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  //draw
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 36);
  gl.drawElements(gl.TRIANGLE_FAN, 8, gl.UNSIGNED_BYTE, 44);
  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_BYTE, 52);

  //=====Star Base=====
  modelMatrix.setTranslate(-0.5,0.0,0.0);
  modelMatrix.rotate(90, 1,0,0);
  modelMatrix.rotate(-50, 1,0,0);
  modelMatrix.scale(0.8,0.8,0.5);
  modelMatrix.rotate(currentAngle+extra_angle, 0,0,1);
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);
  gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_BYTE, 88);
  gl.drawElements(gl.TRIANGLES, 18, gl.UNSIGNED_BYTE, 106);
  gl.drawElements(gl.TRIANGLES, 72, gl.UNSIGNED_BYTE, 124);



}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) 
{
//==============================================================================
  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  
  // Update the current rotation angle (adjusted by the elapsed time)
  //  limit the angle to move smoothly between +20 and -85 degrees:
  if(angle >  120.0 && ANGLE_STEP > 0) ANGLE_STEP = -ANGLE_STEP;
  if(angle < -120.0 && ANGLE_STEP < 0) ANGLE_STEP = -ANGLE_STEP;
  
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function myMouseDown(ev, gl, canvas) 
{
// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = true;                      // set our mouse-dragging flag
  xMclik = x;                         // record where mouse-dragging began
  yMclik = y;
};

function myMouseMove(ev, gl, canvas) 
{
  if(isDrag==false) return;       // IGNORE all mouse-moves except 'dragging'

  // Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
//  console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

  // find how far we dragged the mouse:
  xMdragTot += (x - xMclik);          // Accumulate change-in-mouse-position,&
  yMdragTot += (y - yMclik);
  xMclik = x;                         // Make next drag-measurement from here.
  yMclik = y;
  mousemove = 1;

};

function myMouseUp(ev, gl, canvas) 
{
  var rect = ev.target.getBoundingClientRect(); // get canvas corners in pixels
  var xp = ev.clientX - rect.left;                  // x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top); // y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
  // Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  /    // move origin to center of canvas and
               (canvas.width/2);      // normalize canvas to -1 <= x < +1,
  var y = (yp - canvas.height/2) /    //                     -1 <= y < +1.
               (canvas.height/2);
  console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
  
  isDrag = false;                     // CLEAR our mouse-dragging flag, and
  // accumulate any final bit of mouse-dragging we did:
  xMdragTotprev = xMdragTot;
  yMdragTotprev = yMdragTot;
  xMdragTot += (x - xMclik);
  yMdragTot += (y - yMclik);
  
  console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);

  if (!mousemove && xMdragTotprev == xMdragTot && yMdragTot == yMdragTotprev)
  {
    leftorright();
  }
  else
    mousemove = 0;
};

function myKeyUp(ev) 
{
// Called when user releases ANY key on the keyboard; captures scancodes well

  console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
}

function myKeyPress(ev) 
{
  console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
                        ', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
                        ', altKey='   +ev.altKey   +
                        ', metaKey(Command key or Windows key)='+ev.metaKey);
}

function myKeyDown(ev) {
  var step = 5;
  switch (ev.keyCode) {
    case 38: // Up arrow key -> the positive rotation of joint1 around the z-axis
      if (g_joint1Angle < 20.0) g_joint1Angle += step;
      break;
    case 40: // Down arrow key -> the negative rotation of joint1 around the z-axis
      if (g_joint1Angle > -20.0) g_joint1Angle -= step;
      break;
    case 39: // Right arrow key -> the positive rotation of arm1 around the y-axis
      g_arm1Angle = (g_arm1Angle + ANGLE_STEP) % 360;
      break;
    case 37: // Left arrow key -> the negative rotation of arm1 around the y-axis
      g_arm1Angle = (g_arm1Angle - ANGLE_STEP) % 360;
      break;
    default: return; // Skip drawing at no effective action
  }

  //draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);

}

function leftorright()
{
  if (isDrag == false)
  {
    if (xMclik < -0.5)
       extra_angle += -20;
    else
      extra_angle += 20;
  } 
}

function clearmotion()
{
  location.reload();
}