/// Copyright(C) 2023 - 2033 Solarshingle Canada - All Rights Reserved
/// For case 4, the roof is a parallelogram.
///Constants of SS
const ss_width = 55.63;
const ss_height = 16.73;
const side_diff = 1; // inch
const eave_ss_offset = 2;
const ridge_ss_offset = 13;
const left_right_ss_offset = 4;
const metel_cover_height = 13; // this cover is used when ridge < ease.
const drawing_offset = 10; // to flip the shape. but leave a bit space.
//// Special offsets for section-style 
const sec_eave_ss_offset = 2;
const sec_ridge_ss_offset = 6;
const sec_left_right_ss_offset = 0.5; 
const sec_min_short_hori_edge = 6;

/// global flags
var g_symmetric = false;
var g_rectangle = false;
var g_normal_trapezoidal = false; // normal (top shorter than bottom) vs invert Trapezoidal
var g_parallelogram = false;
var g_left_ref_line = false; // the vertical line on the left or right side.
var g_use_ref_line = false;
var g_invert_eave_short = false;
var g_left_offset_positive = false;
var g_data_is_valid = false;


/// computed values
var cv_real_height = 1;
var cv_real_left_side = 1;
var cv_real_right_side = 1;
var cv_ref_line_x = 0;
var cv_left_gap_x = 0;  // left offset length. This value is to help determine the area of SS, 
                       // it is a bit longer than left_right_ss_offset. 
var cv_right_gap_x = 0; // right offset length.
var cv_total_rows = 0;
var cv_invert_start_y = 0;
var cv_max_ss_in_row = 0;
var cv_tilting_offset = 0;
 
// section style related:
var cv_sec_left_gap_x = 0;
var cv_sec_right_gap_x = 0;

/// For keep tracking left/right offset input textbox.
const read_data_status = {
    left_offset: false,
    right_offset: false
}

const symm_line = {
    k: 0.8,
    b: 1
}

const left_side_eq = {
    k: 0.8,
    b: 1
}
const right_side_eq = {
    k: 0.8,
    b: 1
}


// Define array of 4 corners. Need to update values in array. 
var four_corners = [[0, 1], [2, 3], [4, 5], [6, 7]]; // left-bottom, left-top, right-top, right-bottom. 

var four_ss_corners = [];
var ms_corners = [];


/// for testing purpose if HTML page is not available.
const roof = {
    eave: 280,
    ridge: 280,
    left_side: 200,
    right_side: 200,
    left_offset: 111, // left_offset + right_offset = ridge-eave (or eave-ridge)
    right_offset: 0,
    height_measured: 220,
    height_measured_roof: 220,
    angle: 30, // deg between horizontal line and roof surface.
    style: 0
}


// The roof is parallelogram, the center of the tile top-edge is put at the middle between left and right.
// Since the height of tile (or SS) and tilted shape, the actual length for putting tile is less than the eave. 
function  test_case4() {
    set_g_variable();
    if (four_ss_corners.length > 0) {
        four_ss_corners.length = 0;
        console.log("four_ss_corners : " + four_ss_corners.length);
    }
    if (ms_corners.length > 0) {
        ms_corners.length = 0;
    }

    g_parallelogram = true;
    console.log("roof angle " + roof.angle);
    cv_real_height = find_real_height(roof.angle, roof.height_measured, roof.height_measured_roof);
    // from real_height and offset, find the x-direction offset due to tilting
    console.log("real height " + cv_real_height); 
    var total_rows = find_total_rows(cv_real_height, eave_ss_offset, ridge_ss_offset);
    console.log("Total rows  " + total_rows);
    cv_total_rows = total_rows;
    find_real_side_length(cv_real_height, roof);
    if (cv_real_left_side > 0) {
        cv_real_right_side = cv_real_left_side;
    }
    else {
        cv_real_left_side = cv_real_right_side;
    }
    if (roof.left_offset > 0) {
        g_left_offset_positive = true;
    }
    else {
        g_left_offset_positive = false; 
    }
    console.log("Real left side length ", cv_real_left_side);
    console.log("Real right side length ", cv_real_right_side);
    find_corner_coord_case4(roof, cv_real_height);
    console.log("Coordinates " + four_corners);
    console.log("normal or invert shape " + g_normal_trapezoidal);
    find_gaps(roof);
    find_symm_line_in_parallelogram(roof);
    find_line_eqs_for_left_right_side(roof);
    

    if (roof.style == 0) {
        find_parallelogram_ss(roof);
    }
    else {
        sec_find_parallelogram_ss(roof);
    }
 
    find_linear_inch();
}


function display_inputs(roof) {
    console.log("EAVE " + roof.eave);
    console.log("RIDGE " + roof.ridge);
    console.log("LEFT OFFSET " + roof.left_offset);
    console.log("RIGHT OFFSET " + roof.right_offset);
    console.log("HEIGHT_MEASURED " + roof.height_measured);
    console.log("HEIGHT_MEASURED_REAL " + roof.height_measured_roof);
    console.log("ANGLE " + roof.angle);
}


/// For calculating final results
function find_linear_inch() {
    if (roof.style == 0) {
        let height = cv_total_rows * ss_height;
        let width = cv_max_ss_in_row * ss_width;
        let num_ss = four_ss_corners.length / 8;
        document.getElementById('num_ss').value = num_ss;
        document.getElementById('perimeter').value = Math.ceil((2 * height + 2 * width) / 12.0);
        document.getElementById('num_ms').value = 0;
    }
    else {
        let height = cv_total_rows * ss_height;
        let width = cv_max_ss_in_row * ss_width;
        let num_ss = four_ss_corners.length / 8;
        document.getElementById('num_ss').value = num_ss;
        let len = 2 * cv_real_height + roof.eave + roof.ridge;
        document.getElementById('perimeter').value = Math.ceil(len / 12.0);
        let num_ms = 0;
        for (let i = 0; i < ms_corners.length; i++) {
            let s = ms_corners[i].length;
            num_ms = num_ms + s;
        }
        document.getElementById('num_ms').value = num_ms;
    }

}


//////// Find Number of SS in each row
/// For parallelogram shape, the length of every row is the same. 
/// Only need to calculate once. 
function find_parallelogram_ss(roof) {
    // always start from eave side:
    if (g_parallelogram) {
        console.log("testing parallelogram... ")
        console.log("total rows " + cv_total_rows);
        // Need to remove x-offset due to tilting. call it tilting_offset; 
        var actual_width = find_tilting_width(roof, cv_left_gap_x, cv_right_gap_x);

        var ss_per_row = Math.floor(actual_width / ss_width);
        console.log("ss per row " + ss_per_row);

        cv_max_ss_in_row = ss_per_row;

        // total ss length
        var ss_length = ss_per_row * ss_width;
        var first_y = eave_ss_offset + ss_height / 2;
        // Need to find the x-offset outside of roof due to tilting. 
        // from the equation, find (x, y)
        var center_x = (first_y - symm_line.b)/ symm_line.k;

        var start_x = center_x - ss_length / 2;
        console.log("start x " + start_x);
        console.log("start y " + first_y);

        var start_y = eave_ss_offset;
        for (let row = 0; row < cv_total_rows; row++) {
            let y1 = Math.floor(start_y + row * ss_height); // use y of the top of the row.
            let y2 = Math.floor(start_y + (row + 1) * ss_height);
            let mid_y = Math.floor(start_y + (row + 0.5)* ss_height);
            let center_x = (mid_y - symm_line.b) / symm_line.k;
            let start_x = center_x - ss_length / 2;
            for (let col = 0; col < ss_per_row; col++) {
                let left = Math.floor(col * ss_width + start_x);
                console.log("Left " + left);
                let right = Math.floor(left + ss_width);
                console.log("y1 " + y1);
                four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
            }
            console.log("Current coodinate " + four_ss_corners.length);
        }
    }
}

/// For parallelogram shape, the length of every row is the same. 
/// Only need to calculate once. 
function sec_find_parallelogram_ss(roof) {
    // always start from eave side:
    if (g_parallelogram) {
        let sec_cv_total_rows = find_total_rows(cv_real_height, sec_eave_ss_offset, sec_ridge_ss_offset); 
        console.log("total rows " + sec_cv_total_rows);
        // Need to have info of 4 corners of the row, which already remove gap of 0.5 inches. 
        let y1 = sec_eave_ss_offset;
        let y2 = y1 + ss_height;
        let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_dist_edge_to_ss_2(roof, 1, y1, y2);
        let shorter_edge = 0;
        if ((x_btm_right - x_top_left) < (x_top_right - x_btm_left)) { // select the shorter one  as parallelogram has two tilting.
            // TODO: can use offset = 0 to determine which one is shorter!
            shorter_edge = x_btm_right - x_top_left;
        }
        else {
            shorter_edge = x_top_right - x_btm_left;
        }
        // shorter_edge is the width which can be put solar shingle. 
        // Need to remove x-offset due to tilting. call it tilting_offset; 
        // var actual_width = find_tilting_width(roof, cv_sec_left_gap_x, cv_sec_right_gap_x);
        shorter_edge = shorter_edge - 2.0 * sec_min_short_hori_edge;
        //actual_width = actual_width - shorter_edge; // need to ensure each end has 6 inch 
        let ss_per_row = Math.floor(shorter_edge / ss_width);
        console.log("ss per row " + ss_per_row);

        cv_max_ss_in_row = ss_per_row;

        // total ss length
        let ss_length = ss_per_row * ss_width;
        let first_y = sec_eave_ss_offset + ss_height / 2;
        // Need to find the x-offset outside of roof due to tilting. 
        // from the equation, find (x, y)
        let center_x = (first_y - symm_line.b) / symm_line.k;

        let start_x = center_x - ss_length / 2;
        console.log("start x " + start_x);
        console.log("start y " + first_y);

        let start_y = sec_eave_ss_offset;
        for (let row = 0; row < sec_cv_total_rows; row++) {
            let y1 = Math.floor(start_y + row * ss_height); // use y of the top of the row.
            let y2 = Math.floor(start_y + (row + 1) * ss_height);
            let mid_y = Math.floor(start_y + (row + 0.5) * ss_height);
            let center_x = (mid_y - symm_line.b) / symm_line.k;
            let start_x = center_x - ss_length / 2;
            for (let col = 0; col < ss_per_row; col++) {
                let left = Math.floor(col * ss_width + start_x);
                console.log("Left " + left);
                let right = Math.floor(left + ss_width);
                console.log("y1 " + y1);
                four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
            }
            // need to update 4 corners.
            let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_dist_edge_to_ss_2(roof, 1 , y1, y2);
            if (ss_length > 0) {
                var metal_1 = [];
                var metal_2 = [];
                var metal_3 = [];
                var metal_4 = [];
                var metals = [];
                let end_x = start_x + ss_length; // last SS
                if (g_left_offset_positive) { /// tiltling like \  \ 
                    if (((start_x - x_btm_left) > 2 * sec_min_short_hori_edge) && ((start_x - x_top_left) > ss_width)) {
                        // if shorter edge > 12 inches and longer one > ss_width (this condition is the same as for trapezoidal)
                        let x_mid = x_btm_left + sec_min_short_hori_edge;
                        metal_1.push(x_btm_left, y1, x_top_left, y2, x_mid, y2, x_mid, y1);
                        metal_2.push(x_mid, y1, x_mid, y2, start_x, y2, start_x, y1);
                        metals.push(metal_1, metal_2);
                        console.log("METAL 1 x btm-left " + x_btm_left);
                        console.log("METAL 1 x x_mid " + x_mid);
                        let x_mid_2 = x_top_right - sec_min_short_hori_edge;
                        metal_3.push(end_x, y1, end_x, y2, x_mid_2, y2, x_mid_2, y1);
                        metal_4.push(x_mid_2, y1, x_mid_2, y2, x_top_right, y2, x_btm_right, y1);
                        metals.push(metal_3, metal_4);
                    }
                    else {
                        // just one metal shingle for each end.
                        metal_1.push(x_btm_left, y1, x_top_left, y2, start_x, y2, start_x, y1);
                        metal_2.push(end_x, y1, end_x, y2, x_top_right, y2, x_btm_right, y1);
                        metals.push(metal_1, metal_2);
                    }
                    ms_corners.push(metals);
                }
                else { // tilting like / / 
                    if (((start_x - x_top_left) > 2 * sec_min_short_hori_edge) && ((start_x - x_btm_left) > ss_width)) {
                        // if shorter edge > 12 inches and longer one > ss_width (this condition is the same as for trapezoidal)
                        let x_mid = x_top_left + sec_min_short_hori_edge;
                        metal_1.push(x_btm_left, y1, x_top_left, y2, x_mid, y2, x_mid, y1);
                        metal_2.push(x_mid, y1, x_mid, y2, start_x, y2, start_x, y1);
                        metals.push(metal_1, metal_2);
                        console.log("METAL 1 x top-left " + x_top_left);
                        console.log("METAL 1 x x_mid " + x_mid);
                        let x_mid_2 = x_btm_right - sec_min_short_hori_edge;
                        metal_3.push(end_x, y1, end_x, y2, x_mid_2, y2, x_mid_2, y1);
                        metal_4.push(x_mid_2, y1, x_mid_2, y2, x_top_right, y2, x_btm_right, y1);
                        metals.push(metal_3, metal_4);

                    }
                    else {
                        // just one metal shingle for each end.
                        metal_1.push(x_btm_left, y1, x_top_left, y2, start_x, y2, start_x, y1);
                        metal_2.push(end_x, y1, end_x, y2, x_top_right, y2, x_btm_right, y1);
                        metals.push(metal_1, metal_2);
                    }
                    ms_corners.push(metals);
                }
            }
            console.log("Current coodinate " + four_ss_corners.length);
        }
    }
}


/// Return array of four x values for y_btm, y_top
function sec_get_dist_edge_to_ss_2(roof, start_x,  y_btm, y_top) {
    var x1 = get_y(left_side_eq.k, left_side_eq.b, y_btm); // x on left side with y_btm
    var x_btm_left = x1 + cv_sec_left_gap_x;
        
    var x2 = get_y(right_side_eq.k, right_side_eq.b, y_btm); // x value on the right side with y_btm (from x = 0)
    var x_btm_right = x2 - cv_sec_right_gap_x;

    var x3 = get_y(left_side_eq.k, left_side_eq.b, y_top);
    var x_top_left = x3 + cv_sec_left_gap_x;

    var x4 = get_y(right_side_eq.k, right_side_eq.b, y_top);
    var x_top_right = x4 - cv_sec_right_gap_x;

    console.log(start_x); 
    console.log("<<<======>>>>")
    console.log("left side");
    console.log(x_btm_left);
    console.log(x_top_left);
    console.log("right side ")
    console.log(x_btm_right);
    console.log(x_top_right);
    console.log(">>>======<<<")
    return [x_btm_left, x_top_left, x_btm_right, x_top_right];
}

 

//////// Utility functions
/// find y value from x, using equation:
function get_y(k, b, y) {
    x = (y - b) / k;
    return x; 
}


/// find the center of a parallelogram.
/// This will be used for determine start-x position of each row of SS.
function find_symm_line_in_parallelogram(roof) {
    // use four_corners[], find mid of 0 & 3, 2&3.
    var x1 = (four_corners[0][0] + four_corners[3][0]) / 2;
    var x2 = (four_corners[1][0] + four_corners[2][0]) / 2;
    var y1 = 0;
    var y2 = cv_real_height;
    var k = y2 / (x2 - x1);
    var b = (-x1 * y2) / (x2 - x1);
    symm_line.k = k;
    symm_line.b = b;
}


/// Find equations for Left & Right side 
function find_line_eqs_for_left_right_side(roof) {
    // use four_corners[], find mid of 0 & 3, 2&3.
    var x1 = four_corners[0][0];
    var y1 = four_corners[0][1];
    var x2 = four_corners[1][0];
    var y2 = four_corners[1][1];

    var k = (y2 - y1) / (x2 - x1);
    var b = y1 - k * x1;
    left_side_eq.k = k;
    left_side_eq.b = b;

    x1 = four_corners[2][0];
    y1 = four_corners[2][1];
    x2 = four_corners[3][0];
    y2 = four_corners[3][1];
    k = (y2 - y1) / (x2 - x1);
    b = y1 - k * x1;
    right_side_eq.k = k;
    right_side_eq.b = b; 
}

///TODO: need to check if should use y=ss_height/2 as we want to align the middle of row of SS 
/// to the symmetric line??
function find_tilting_width(roof, left_gap_x, right_gap_x) {
    var offset = roof.left_offset;
    if (offset == 0) {
        offset = roof.right_offset;
    }
    // Need to use offset and real height. 
    // for each row of SS, the middle of its top edge is aligned to the "symmetric line" of 
    // the parallelogram(i.e.the center in x - direction)
    var y = eave_ss_offset + ss_height;
    var x = offset * y / cv_real_height; // this is the x-offset value at the bottom row from x=0. 
    cv_tilting_offset = x; // this is the x-distance that cannot be used to put a SS along eave 
    // because the center of SS is align to the middle of parallelogram, 
    var temp = (roof.eave - left_gap_x - right_gap_x);
    temp = temp - x; // only need to consider one side of roof. 
    var width = temp;
    console.log(" &&&& cv_tilting_offset =  " + x); 
    return width; 
 
}

   
/// Need to use actual height instead of height measured from map. 
function find_corner_coord_case4(roof, actual_height) {
    if (g_left_offset_positive == true) { // \_\ shape
        four_corners[0][0] = roof.left_offset;
        four_corners[0][1] = 0;
        four_corners[1][0] = 0;
        four_corners[1][1] = actual_height;
        four_corners[2][0] = roof.eave;
        four_corners[2][1] = actual_height;
        four_corners[3][0] = roof.left_offset + roof.eave;
        four_corners[3][1] = 0;
    }
    else { //  /_/ shape
        four_corners[0][0] = 0;
        four_corners[0][1] = 0;
        four_corners[1][0] = roof.right_offset;
        four_corners[1][1] = actual_height;
        four_corners[2][0] = roof.right_offset + roof.eave;
        four_corners[2][1] = actual_height;
        four_corners[3][0] = roof.eave;
        four_corners[3][1] = 0;

    }
}

 
// Find the gap of two sides for all trapezoidal shapes.
// The distance between roof edge and the area of SS on both left/right sides 
// is fixed to left_right_ss_offset. But we need to find the actual x-distance to
// simplified the computation of number of SS in each row etc. 
function find_gaps(roof) {
    // Find x-distance given the distance between roof edge and SS area (i.e. gap btw two parallel lines):
    // Two triangles share the same angle (lower left corner), hence: 
    cv_left_gap_x = cv_real_left_side * left_right_ss_offset / cv_real_height;
    cv_right_gap_x = cv_real_right_side * left_right_ss_offset / cv_real_height;
    console.log("&&&& GAP is " + cv_left_gap_x); 
}


///TODO: merge these two functions
/// Use height (distance between eave and ridge)
function find_total_rows(actual_height, bottom_offset, top_offset) { 
    var total_height = (actual_height - bottom_offset - top_offset) / ss_height;
    console.log("t " + total_height);
    var total_rows = Math.floor(total_height);
    return total_rows;
}

 
/// Use the length of the left and right side to determine if roof is symmetric.
/// Use left-offset and right-offset is also possible.
function check_symmetric(roof) {
    var symmetric = false;
      
    if (Math.abs(roof.left_offset - roof.right_offset) < side_diff) {
        symmetric = true;
    }
    else {
        symmetric = false;
    }
    console.log(symmetric);
    return symmetric;
}


/// for symmetric shape. Find height
function check_rectangle(roof) {
    var rect = false;
    if (Math.abs(roof.eave - roof.ridge) < 1) {
        rect = true;
    }
    return rect; 
}


/// Find the "actual height" of roof which is the distance from eave to ridge. 
function find_real_height(angle, height_measured, height_measured_real) {
    if (height_measured_real == 0) {
        var angle_rad = angle * Math.PI / 180.0;
        var real_height = height_measured / Math.cos(angle_rad);
        return Math.floor(real_height);
    }
    else {
        return height_measured_real;
    }
}


/// Use side_offset and actual height to get real_side_length.
function find_real_side_length(actual_height, roof) {
    cv_real_left_side = 0;
    cv_real_right_side = 0;
    if (roof.left_offset > 0) {
        var t = Math.sqrt(roof.left_offset * roof.left_offset + actual_height * actual_height);
        cv_real_left_side = Math.floor(t);
         
    }
    if (roof.right_offset > 0) {
        var t = Math.sqrt(roof.right_offset * roof.right_offset + actual_height * actual_height);
        cv_real_right_side = Math.floor(t);
    }
}


function set_g_variable() {
    g_symmetric = false;
    g_rectangle = false;
    g_normal_trapezoidal = false; // normal (top shorter than bottom) vs invert Trapezoidal
    g_left_ref_line = false; // the vertical line on the left or right side.
    g_use_ref_line = false;
    g_invert_eave_short = false;
    g_flipped = false;
}

//// Draw() function 
function draw() {

    const canvas = document.querySelector('#canvas');
    if (canvas.getContext) {
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var y_upper = cv_real_height + drawing_offset;

        console.log("height " + canvas.height);
        console.log("y_upper " + y_upper);
        //drawLine(ctx, [100, 100], [100, 300], 'green', 5);
        for (let i = 0; i < 4; i++) {
            drawLine(ctx, [four_corners[i][0], y_upper - four_corners[i][1]], [four_corners[(i + 1) % 4][0], y_upper - four_corners[(i+1)%4][1]], 'green', 3);
        }
        //if (g_parallelogram == false ) {
        //    drawLine(ctx, [cv_ref_line_x, drawing_offset], [cv_ref_line_x, cv_real_height + drawing_offset], 'red', 2);
        //}
       
        
        var total = four_ss_corners.length;
        //for (let i = 0; i < total; i=i+2) {
        //    drawCircles(ctx, four_ss_corners[i], four_ss_corners[i + 1], 1);
        //}
        var total_ss = total / 8;
        for (let i = 0; i < total_ss; i = i + 1) {
            drawLine(ctx, [four_ss_corners[i * 8], y_upper - four_ss_corners[i * 8 + 1]], [four_ss_corners[i * 8 + 2], y_upper - four_ss_corners[i * 8 + 3]], 'blue', 2);
            drawLine(ctx, [four_ss_corners[i * 8 + 2], y_upper - four_ss_corners[i * 8 + 3]], [four_ss_corners[i * 8 + 4], y_upper - four_ss_corners[i * 8 + 5]], 'blue', 2);
            drawLine(ctx, [four_ss_corners[i * 8 + 4], y_upper - four_ss_corners[i * 8 + 5]], [four_ss_corners[i * 8 + 6], y_upper - four_ss_corners[i * 8 + 7]], 'blue', 2);
            drawLine(ctx, [four_ss_corners[i * 8 + 6], y_upper - four_ss_corners[i * 8 + 7]], [four_ss_corners[i * 8], y_upper - four_ss_corners[i * 8 + 1]], 'blue', 2);
        }
        //drawLine(ctx, [0, canvas.height], [canvas.width, canvas.height], 'black', 4);
        //drawLine(ctx, [0, 0], [canvas.width, 0], 'black', 4);

        //drawLine(ctx, [2, 2], [2, canvas.heighth], 'black', 4);
        //drawLine(ctx, [canvas.width, 0], [canvas.width, canvas.height], 'black', 4);
        var x1 = Math.floor ((four_corners[0][0] + four_corners[3][0]) / 2) - 1;
        var x2 = Math.floor ((four_corners[1][0] + four_corners[2][0]) / 2) - 1 ;
        var y1 = y_upper - 0;
        var y2 = y_upper - cv_real_height;

        if (g_parallelogram) {
            drawLine(ctx, [x1, y1], [x2, y2], 'red', 1);
        }
        if (roof.style == 0) {
            return; 
        }
        for (let i = 0; i < ms_corners.length; i++) {
            var row = ms_corners[i];
            var diff_color = false;
            
            console.log("---- row ---- ")
            if (row.length > 2) {
                diff_color = true;
            }
            for (let j = 0; j < row.length; j++) {
                var one_ms = row[j];
                //for (let k = 0; k < one_ms.length; k=k+2) {
                //    drawCircles(ctx,  one_ms[k], y_upper - one_ms[k + 1], 1); 
                //}
                if (diff_color == true) {
                    if (j % 2 == 0) {
                        fill_area(ctx, y_upper, one_ms, 'blue', 3, 'gray');
                    }
                    else {
                        fill_area(ctx, y_upper, one_ms, 'blue', 2, 'gray');
                    }
                }
                else {
                    fill_area(ctx, y_upper, one_ms, 'blue', 2, 'gray');
                }
            }
        }
    }
}


function drawLine(ctx, begin, end, stroke = 'black', width = 1) {
    if (stroke) {
        ctx.strokeStyle = stroke;
    }

    if (width) {
        ctx.lineWidth = width;
    }

    ctx.beginPath();
    ctx.moveTo(...begin);
    ctx.lineTo(...end);
    ctx.stroke();
}


function drawCircles(ctx, centerX, centerY, radius) {
    let circle = new Path2D();  // <<< Declaration
    circle.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);

    ctx.fillStyle = 'yellow';
    ctx.fill(circle); //   <<< pass circle to ctx

    ctx.lineWidth = 10;
    ctx.strokeStyle = '#000066';
    ctx.stroke(circle);  // <<< pass circle here too
}

// y_upper is the upper bound of y-value for turn the y-axis from bottom to top. 
function fill_area(ctx, y_upper, pts, stroke = 'green', width = 3, fill = 'red') {
    if (stroke) {
        ctx.strokeStyle = stroke;
    }

    if (width) {
        ctx.lineWidth = width;
    }
    //ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.moveTo(pts[0], y_upper - pts[1]);
    for (let i = 2; i < pts.length; i = i + 2) {
        ctx.lineTo(pts[i], y_upper - pts[i + 1]);
    }
    ctx.lineTo(pts[0], y_upper - pts[1]);

    ctx.stroke();

    ctx.fillStyle = fill;
    ctx.fill();
    console.log("Four corners (x, y) ");
    for (let i = 0; i < pts.length; i = i + 2) {
        num_x = pts[i];
        num_y = pts[i + 1];
        //Number(num_x).toFixed(2);
        //Number(num_y).toFixed(2);
        console.log(Number(num_x).toFixed(2) + "  " + Number(num_y).toFixed(2));
    }
}


///// For Input Data.... 
function check_input(val) {
    // const regex = new RegExp(/[^0-9]/, 'g');
    const regex = new RegExp(/^ [+-]?([0-9]+([.][0-9]*)?|[.][0-9]+)$/)
    var status = true;
    if (val.match(regex)) {
        alert("Must be a valid number");
        status = false; 
    }
    return status;
}


/// In HTML code, use change event to set default values of offsets 
/// This may reduce the problem of wrong offsets.
/// Get data from textbox on webpage.
/// Calling check_input is not needed as data field is set to number type only. 
function read_data() {
    var status_left_offset = false;
    var status_right_offset = false;

    var eave = document.getElementById('eave').value;
    var ridge = eave;
    //var ridge = document.getElementById('ridge').value;


    var left_offset = document.getElementById('left_offset').value;
    var right_offset = document.getElementById('right_offset').value;
    var height_measured = document.getElementById('height_measured').value;
    var height_measured_real = document.getElementById('height_measured_real').value;
    var pitch_rise = document.getElementById('pitch_rise').value;
    console.log("read data as " + eave + "   " + ridge);
    //console.log("read data as " + left_side + "   " + right_side);
    console.log("left_offset : " + left_offset + " right_offset: " + right_offset);
    console.log("height measured " + height_measured + " angle:  " + pitch_rise);

    if (check_input(eave) == false) {
        return;
    }
    //if (check_input(ridge) == false) {
    //    return;
    //}

    if (check_input(left_offset) == false) {
        return;
    }
    if (check_input(right_offset) == false) {
        return;
    }
    if (check_input(height_measured) == false) {
        return;
    }
    if (check_input(pitch_rise) == false) {
        return;
    }

    roof.eave = Number(eave);
    roof.ridge = Number(ridge);

 
    if (left_offset == "") {
        status_left_offset = false;
        console.log("left_offset is null ");
    }
    else {
        status_left_offset = true;
        console.log("left_offset has value ");
    }
    
    if (right_offset == "") {
        status_right_offset = false;
        console.log("right_offset is null ");
    }
    else {
        status_right_offset = true;
        console.log("Right offset has value ");
    }
    roof.left_offset = Number(left_offset);
    roof.right_offset = Number(right_offset);
    roof.height_measured = Number(height_measured);
    roof.height_measured_roof = Number(height_measured_real);
    
    if ((roof.height_measured == 0) && (roof.height_measured_real == 0)) {
        console.log("Error: Height of Roof is 0 "); 
        alert("You need to enter the value for the height of the roof...! ");
    }
    pitch_rise_value = Number(pitch_rise);
    if (roof.height_measured == 0) {
        console.log("@@@ Pitch is set to 0")
        pitch_rise = 0; 
    }
    else {
        if ((pitch_rise_value > 18) || (pitch_rise_value < 0)) {
            alert("The pitch rise value must be positive and <=18 !");
        }
    }


    // convert the value from pitch_rise to angle in degree. It
    var angle_in_deg = Math.atan(pitch_rise / 12.0) * 180.0 / Math.PI; 
    roof.angle = Number(angle_in_deg);
    console.log("roof info ---- roof angle (deg) is " + roof.angle);
    console.log(roof);
    if ((status_left_offset == false) && (status_right_offset == false) ) {
        alert("You need to enter at least one of left_offset or right_offset...! ");

    }
    read_data_status.left_offset = status_left_offset;
    read_data_status.right_offset = status_right_offset;
    var style_selected = document.querySelector('input[name="rect_style"]:checked').value;
    roof.style = Number(style_selected);
}


///
function validate_and_update_data() {
    if ((roof.left_offset > 0) && (roof.right_offset > 0)) {
        console.log("Both offsets > 0 ");
        alert("Data is not valid.. stop");
        return false;
    }
    else {
        if (roof.left_offset > 0) {
            roof.right_offset = 0;
            document.getElementById("right_offset").value = Number(0);
        }
        else {
            roof.left_offset = 0;
            document.getElementById("left_offset").value = Number(0);
        }
        return true;
    }
}


///This function will check the roof data before set up flag.
/// Update text box will be done in update function.
function validate_roof_data_only() {
    var valid = false;
    // rectangle:
    if (Math.abs(roof.eave - roof.ridge) < 1) {
        if ((roof.left_offset < 1) && (roof.right_offset < 1)) {
            valid = true;
        }
        else {
            valid = false; 
        }
        return valid;
    }
    // Not rectangle: 
    var sum = roof.left_offset + roof.right_offset;
    if (roof.eave > roof.ridge) {
        var diff = roof.eave - roof.ridge - sum;
    }
    else {
        var diff = roof.ridge - roof.eave - sum;
    }
    if (diff < 0) {
        alert("Offset is too large!!");
        return;
    }
    if (Math.abs(diff) > 1) {
        valid = false;
    }
    else {
        valid = true;
    }
    return valid; 
}

 
/// read data and check if the condition of eave + left_offset + right_offse = ridge (if eave < ridge)
function read() {
    var v = false;
    read_data_status.left_offset = false;
    read_data_status.right_offset = false;
    while (v == false) {
        read_data();
        v = validate_and_update_data();
        //v = validate_roof_data_only();
    }

    g_data_is_valid = v; 
    read_data_status.left_offset = true;
    read_data_status.right_offset = true;

    console.log("roof info update:   ");
    console.log("read data as " + roof.eave + "   " +  roof.ridge);
    // console.log("read data as " + roof.left_side + "   " +  roof.right_side);
    console.log("left_offset : " +  roof.left_offset + " right_offset: " +  roof.right_offset);
    console.log("height measured " +  roof.height_measured + " angle:  " +  roof.angle);
}

/// For testing (Try it) button
function save_data() {
    //console.log(four_ss_corners);
    console.log("In save_data()"); 
    var j = JSON.stringify(four_ss_corners);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(four_ss_corners, "SS", 2)], {
        type: "application/json"
    }));
    a.setAttribute("download", "data000.json");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}
