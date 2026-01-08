/// Copyright(C) 2023 - 2033 Solarshingle Canada - All Rights Reserved
/// For calculating number of Singles in a roof of dropped eave shape.
/// Since the left and right side of roof are in vertical direction, 
/// only need to consider one row from bottom. 
///Constants of SS
 
const SS_CONFIG = {
    ss_width: 55.63,
    ss_height: 16.73,
    side_diff: 1, // inch
    eave_ss_offset: 2,
    ridge_ss_offset: 13,
    left_right_ss_offset: 4,
    metel_cover_height: 13, // this cover is used when ridge < ease.
    drawing_offset: 10, // to flip the shape. but leave a bit space.
};

const SEC_SS_CONFIG = {
    //// Special offsets for section-style 
    sec_eave_ss_offset: 2,
    sec_ridge_ss_offset: 6,
    sec_left_right_ss_offset: 0.5,
    sec_min_short_hori_edge: 6,// min horizontal edge length.
    sec_ms_fix_width: 27.7953, // 706mm
}
//// Special offsets for mix-style
const mix_left_edge_offset = 2; 
const odd_shape_left = true; 


/// global flags
const G_FLAG = {
    g_symmetric: false,
    g_rectangle: false,
    g_normal_trapezoidal: false, // normal (top shorter than bottom) vs invert Trapezoidal
    g_parallelogram: false,
    g_left_ref_line: false, // the vertical line on the left or right side.
    g_use_ref_line: false,
    g_invert_eave_short: false,
    g_left_offset_positive: false,
    g_data_is_valid: false,
    g_max_fit: false, // when it is true, try to fit max num of shingles even it is not symmetric.
    g_flipped: false,
    g_vertical_line: false,
    g_no_metal_on_vert_edge: false,
    g_dropped_eave: false,
    g_dropped_eave_lower_part_rows : 0,
    g_odd_shape_left: true
};


const CV = {
    cv_real_height: 1,
    cv_real_left_side: 1,
    cv_real_right_side: 1,
    cv_ref_line_x: 1,
    cv_left_gap_x: 1,
    cv_right_gap_x: 1,
    cv_total_rows: 1,
    cv_invert_start_y: 1,
    cv_max_ss_in_row: 1,
    cv_tilting_offset: 1,
    cv_left_outside: 1,// at current y (height), the width of outside of the roof.
    cv_right_outside: 1,
    cv_real_dropped_eave_height: 1
}; 

// section style related:
var cv_sec_left_gap_x = 0; 
var cv_sec_right_gap_x = 0;
var cv_sec_invert_start_y = 0; 
var cv_sec_total_rows = 0; 

// variables for dropped eave roof
 
var cv_dropped_eave_x = 0; // need to get this point as x
var cv_dropped_eave_y = 0; // this can be found by difference of 2 sides. 

 
/// For keep tracking left/right offset input textbox.
const read_data_status = {
    left_offset: false,
    right_offset: false
}

const last_row_info = {
    start_x: 0,
    num_ss: 0
}

const removed_ss = {
    row: 0,
    index:0, // index in the list 
    start: true,
    x1: 0,
    y1: 0,
    x2: 1,
    y2: 1
}
 
// Define array of 4 corners. Need to update values in array. 
var four_corners = [[0, 1], [2, 3], [4, 5], [6, 7]]; // left-bottom, left-top, right-top, right-bottom. 
var six_corners = [[0, 1], [2, 3], [4, 5], [6, 7], [0, -1], [-2, -3]];
var four_ss_corners = [];
var ms_corners = [];

/// measured roof info. These are the data 
const roof1 = {
    eave: 480,
    ridge: 280,
    left_side: 200,
    right_side: 190,
    left_offset: 100, // left_offset + right_offset = ridge-eave (or eave-ridge)
    right_offset: 100,
    height_measured: 190,
    angle: 30, // deg between horizontal line and roof surface.
    style: 0  // 0--blend, 1--section 1, 2--section 2
}

/// for testing purpose if HTML page is not available.
/// Add 5 parameters for dropped eave roof. 
const roof = {
    eave: 200,
    ridge: 380,
    left_side: 290, // force left is normal length! 
    right_side: 220,
    left_offset: 0, // left_offset + right_offset = ridge-eave (or eave-ridge)
    right_offset: 0,
    height_measured: 220,
    height_measured_roof: 220,
    dropped_eave: 100, // stage l
    stage_length: 100, // actually the width (horizontal)
    left_height_measured: 220,
    left_height_measured_roof: 220,
    right_height_measured: 220,
    right_height_measured_roof: 220,
    stage_height_measured: 100, // measurement on ground, need angle info. 
    stage_height_measure_roof: 110, // actually vertical measurement from ridge to eave
    angle: 30, // deg between horizontal line and roof surface.
    style: 0  // 0--blend, 1--section 1, 2--section 2
}


const left_side_eq = {
    vert: false,
    k: 0.8,
    b: 1
}
const right_side_eq = {
    vert: false,
    k: 0.8,
    b: 1
}

/// For testing (Try it) button
function test() {
    if (G_FLAG.g_data_is_valid == false) {
        alert("Data is not valid.. stop");
        return;
    }
    if (roof.heaght_measured == 0) {

        roof.angle = 0;
    }
    set_g_variable();
    if ((roof.eave + roof.dropped_eave) <= roof.ridge) {
        G_FLAG.g_dropped_eave = true;
        if (G_FLAG.g_odd_shape_left == false) {
            G_FLAG.g_flipped = true; 
        }
         
    }
    else {
        G_FLAG.g_dropped_eave = false;
        alert("The parameters given cannot be used for dropped eave roof. Please try again... ")
        return;
    }
 
    if (four_ss_corners.length > 0) {
        four_ss_corners.length = 0;
        console.log("four_ss_corners : " + four_ss_corners.length);
    }
    if (ms_corners.length > 0) {
        ms_corners.length = 0;
    }
    var symm = false;
    //symm = check_symmetric(roof);
    //console.log("Symmetric check:  " + symm);
    G_FLAG.g_symmetric = symm;
    var rect = check_rectangle(roof);
    console.log("Rectangle " + rect);
    G_FLAG.g_rectangle = rect;
    G_FLAG.g_normal_trapezoidal = check_normal_trapezoidal(roof);
    console.log("Normal trapezoidal ");
    console.log(G_FLAG.g_normal_trapezoidal);

    display_inputs(roof);
    // We flip here! 
    if (G_FLAG.g_odd_shape_left) {
        CV.cv_real_height = find_real_height(roof.angle, roof.height_measured, roof.height_measured_roof);
        CV.cv_real_dropped_eave_height = find_real_height(roof.angle, roof.stage_height_measured, roof.stage_height_measured_roof);
        CV.cv_real_left_side = CV.cv_real_height;
        cv_real_right_side = CV.cv_real_dropped_eave_height;
    }
    else {
        CV.cv_real_height = find_real_height(roof.angle, roof.height_measured, roof.height_measured_roof);
        CV.cv_real_dropped_eave_height = find_real_height(roof.angle, roof.stage_height_measured, roof.stage_height_measured_roof);
        CV.cv_real_left_side = CV.cv_real_dropped_eave_height; 
        cv_real_right_side = CV.cv_real_height;
    }
   
    console.log("real height " + CV.cv_real_height);
    var total_rows = find_total_rows(CV.cv_real_height, SS_CONFIG.eave_ss_offset, SS_CONFIG.ridge_ss_offset);
    console.log("Total rows  " + total_rows);
    CV.cv_total_rows = total_rows;
 
    cv_ref_line_x = SS_CONFIG.left_right_ss_offset;

    // Set up six corners of the shape.
    get_dropped_eave_info(roof); 

 
    console.log("Coordinates " + six_corners);
    //console.log("normal or invert shape " + g_normal_trapezoidal);

    //find_line_eqs_for_left_right_side(roof); // find line equations of left and right edges.
    console.log("IN TEST()   g_vertical line " + G_FLAG.g_vertical_line); 
    
    console.log("2nd run: gaps in x-direction: L and R " + CV.cv_left_gap_x + "    " + CV.cv_right_gap_x);

 

    if (G_FLAG.g_dropped_eave) {
        dropped_eave_placement(roof);
    }
    else {
        alert("Something wrong..... ");
        return; 
    }
    
    find_linear_inch();
}

/// NOTE: the CV info has got the shape flipped if needed.
/// Find coordinates (keep in six_corners)
/// The right gap and right side equation..
/// Find the start_y for invert trapezodial.
/// number of rows for trapezoidal areas. 
/// total rows. 
function get_dropped_eave_info(roof) {
    // The coordinates assume left edge > right edge.  
    // first get coordinates: 
    six_corners[0][0] = 0;
    six_corners[0][1] = 0;
    six_corners[1][0] = 0;
    six_corners[1][1] = CV.cv_real_height;
    six_corners[2][0] = roof.ridge;
    six_corners[2][1] = CV.cv_real_height;
    six_corners[3][0] = roof.ridge;
    six_corners[3][1] = CV.cv_real_height - CV.cv_real_dropped_eave_height;
    six_corners[4][0] = roof.ridge - roof.dropped_eave;
    six_corners[4][1] = six_corners[3][1];
    six_corners[5][0] = roof.eave;
    six_corners[5][1] = 0; 

    cv_dropped_eave_x = six_corners[4][0];
    cv_dropped_eave_y = six_corners[4][1];
    //Find the gap on right slant edge.
    // get the right side 
    var x1 = cv_dropped_eave_x;
    var y1 = cv_dropped_eave_y;
    var x2 = roof.eave;
    var y2 = 0; 
    // If x1 and x2 are the same.
    if (Math.abs(x1 - x2) < 1) {
        console.log("Find vertical line in dropped eave ");
        right_side_eq.vert = true;
        right_side_eq.k = 10000;
        right_side_eq.b = x1;// use x1 for equation x = x1;
    }
    else {
        right_side_eq.vert = false;
        let k = (y2 - y1) / (x2 - x1);
        let b = y1 - k * x1;
        right_side_eq.k = k;
        right_side_eq.b = b;
    }
 

    // The normal method for finding gap on left/right side using offset.
    // Here use another method:
    var x = Math.abs(x1 - x2); // the horizontal distance between 
    var y = Math.abs(y1 - y2);
    var c = Math.sqrt(x * x + y * y);
    var gap = c / y * SS_CONFIG.left_right_ss_offset;
    CV.cv_right_gap_x = gap; 
    CV.cv_left_gap_x = SS_CONFIG.left_right_ss_offset;
    // Need to find the start_y, as it will be inverted shape:
    // given x as the width of SS and 2 gaps. 
    var width = SS_CONFIG.ss_width + CV.cv_left_gap_x + CV.cv_right_gap_x; 
    var modify = true;
    if (width < roof.eave) {
        CV.cv_invert_start_y = SS_CONFIG.eave_ss_offset;
    }
    else {
        // find y from width which is x from equation:
        var tmp_y = Math.ceil(right_side_eq.k * width + right_side_eq.b);  
        if (tmp_y < cv_dropped_eave_y) {
            CV.cv_invert_start_y = tmp_y;
         
        }
        else {
            // cannot fit even 1 row into trapezodial area.
            CV.cv_invert_start_y = cv_dropped_eave_y + SS_CONFIG.eave_ss_offset; 
            modify = false;
        }
    }

    // If the eave is narrow and cannot put 1 SS, the modification of rows is needed. 
    if (modify) {
        G_FLAG.g_dropped_eave_lower_part_rows = Math.floor((cv_dropped_eave_y + SS_CONFIG.eave_ss_offset - CV.cv_invert_start_y) / SS_CONFIG.ss_height) ; // add one row.
        // need to check if the last row (top) has enough offset from dropped eave edge or not.
        var top_edge = G_FLAG.g_dropped_eave_lower_part_rows * SS_CONFIG.ss_height + CV.cv_invert_start_y;
        console.log("Top edge of lower part rows " + top_edge);
        if (top_edge < (cv_dropped_eave_y + SS_CONFIG.eave_ss_offset)) {
            G_FLAG.g_dropped_eave_lower_part_rows = G_FLAG.g_dropped_eave_lower_part_rows + 1; // this is normal case... 
        }

    }
    CV.cv_total_rows = Math.floor((CV.cv_real_height - CV.cv_invert_start_y) / SS_CONFIG.ss_height);

}
/////// Utility Functions 
/// This function is to swap left and right if needed.
/// Re-calculate is also possible.
/// May be no need to swap the real-left-side
function swap_left_right_edge_gaps() {
    var temp = CV.cv_left_gap_x;
    CV.cv_left_gap_x = CV.cv_right_gap_x;
    CV.cv_right_gap_x = temp;
    temp = cv_sec_left_gap_x;
    cv_sec_left_gap_x = cv_sec_right_gap_x;
    cv_sec_right_gap_x = temp; 
    // CV.cv_real_left_side
}


/// Functions needed in test(). 
/// Arranged in alphabetic order
/// This function is only for invert trapezoidal.
/// set G_FLAG.g_invert_eave_short = true if it is shorter than one SS. 
/// Prepare for finding number of SS.
function check_normal_trapezoidal(roof) {
    if (roof.eave > roof.ridge) {
        return true;
    }
    else {
        return false;
    }
}


/// for symmetric shape. Find height
function check_rectangle(roof) {
    var rect = false;
    if (Math.abs(roof.eave - roof.ridge) < 1) {
        rect = true;
    }
    return rect;
}

  


/////////////// Code to check if we can put one shingle on the unused side of reference line.
/////////////// This will maximize the shingles. 
function compare_offset_with_shingle_width(roof, offset, edge_gap, row_height) {
    console.log("Real height" + CV.cv_real_height);
    var x = offset * row_height / CV.cv_real_height;
    var t = offset - x;
    console.log("Inside width " + t);
    console.log("Edge gap" + edge_gap);

    if (t > (edge_gap + SS_CONFIG.ss_width)) {
        return true;
    }
    else {
        return false;
    }
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
        var height = CV.cv_total_rows * SS_CONFIG.ss_height;
        var width = cv_max_ss_in_row * SS_CONFIG.ss_width;
        var num_ss = four_ss_corners.length / 8;
        document.getElementById('num_ss').value = num_ss;
        document.getElementById('perimeter').value = Math.ceil((2 * height + 2 * width) / 12.0);
        document.getElementById('num_ms').value = 0;
    }
    else {
        var num_ss = four_ss_corners.length / 8;
        document.getElementById('num_ss').value = num_ss;
        var len = 2 * CV.cv_real_height + roof.eave + roof.ridge;
        document.getElementById('perimeter').value = Math.ceil(len / 12.0);
        var num_ms = 0;
        for (let i = 0; i < ms_corners.length; i++) {
            var s = ms_corners[i].length;
            num_ms = num_ms + s;
        }
        document.getElementById('num_ms').value = num_ms;
    }

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
  


///TODO: merge these two functions
/// Use height (distance between eave and ridge)
function find_total_rows(actual_height, bottom_offset, top_offset) {
    var total_height = (actual_height - bottom_offset - top_offset) / SS_CONFIG.ss_height;
    var total_rows = Math.floor(total_height);
    return total_rows;
}

 

function set_g_variable() {
    G_FLAG.g_symmetric = false;
    G_FLAG.g_rectangle = false;
    G_FLAG.g_normal_trapezoidal = false; // normal (top shorter than bottom) vs invert Trapezoidal
    G_FLAG.g_left_ref_line = false; // the vertical line on the left or right side.
    G_FLAG.g_use_ref_line = false;
    G_FLAG.g_invert_eave_short = false;
    G_FLAG.g_left_offset_positive = false;
    G_FLAG.g_max_fit = false;
    G_FLAG.g_flipped = false;
    G_FLAG.g_vertical_line = false;
    G_FLAG.g_no_metal_on_vert_edge = false;
    G_FLAG.g_dropped_eave = false;
    G_FLAG.g_dropped_eave_lower_part_rows = 0;
    //G_FLAG.g_odd_shape_left=true; This flag is set by HTML hiddne label 
}


 
function get_x(k, b, y) {
    x = (y - b) / k;
    return x;
}


///Fill four_ss_corners in a row. 
function get_ss_per_row(ss_per_row, SS_CONFIG, start_x, y1, y2) {
    //console.log("####y1, y2 " + y1 + "   " + y2);
    for (let col = 0; col < ss_per_row; col++) {
        var left = (col * SS_CONFIG.ss_width + start_x);
        var right = (left + SS_CONFIG.ss_width);
        four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
        //console.log("## Col = , ## Left ## Right " + col+"   " + left + "  " + right);
    }
}

 

// flip all SS coordinates left-to-right. Do not change y. 
function flip_left_right(roof) {
    var max_x = 0;
    if (G_FLAG.g_normal_trapezoidal) {
        max_x = roof.eave;
    }
    else {
        max_x = roof.ridge;
    }
    console.log("In flip " + four_ss_corners[0]);
    var total = four_ss_corners.length / 2;
    for (let i = 0; i < total; i++) {
        four_ss_corners[i * 2] = max_x - four_ss_corners[i * 2];
    }
    console.log("In flip after flip " + four_ss_corners[0]);
    for (let i = 0; i < 4; i++) {
        four_corners[i][0] = max_x - four_corners[i][0];
    }
    for (let i = 0; i < 6; i++) {
        six_corners[i][0] = max_x - six_corners[i][0];
    }
    var t = roof.left_offset;
    roof.left_offset = roof.right_offset;
    roof.right_offset = t;
    console.log("left " + roof.left_offset);
    // console.log(" ms_corners " + ms_corners); 
    console.log(" Num of rows " + ms_corners.length);
    for (let i = 0; i < ms_corners.length; i++) {
        var row = ms_corners[i];
        console.log("Row  i = " + i + " number of MS " + row.length);
        for (let j = 0; j < row.length; j++) {
            var one_ms = row[j];
            console.log(" MS j = " + j);
            console.log(" X-y " + one_ms);
            for (let k = 0; k < one_ms.length; k = k + 2) {
                one_ms[k] = max_x - one_ms[k];
            }
            console.log("AFter flipping ");
            console.log("X-y " + one_ms);

        }
    }

}

 

///This function is used to find the 2 corners of a row of SS.
///since only the right side will be covered by metal shingle, 
function get_right_coord(roof, y_btm, y_top) {
    if (right_side_eq.vert) {
        let x_btm_right = roof.eave - SS_CONFIG.left_right_ss_offset;
        let x_top_right = x_btm_right;
        return [x_btm_right, x_top_right];
    }
    else {
        var x2 = get_x(right_side_eq.k, right_side_eq.b, y_btm); // x value on the right side with y_btm (from x = 0)
        var x_btm_right = x2 - cv_sec_right_gap_x;
        var x4 = get_x(right_side_eq.k, right_side_eq.b, y_top);
        var x_top_right = x4 - cv_sec_right_gap_x;
        return [x_btm_right, x_top_right];
    }
}
  

//// End of Utility Functions

/// For dropped eave shape.
/// The left edge is longer than right edge.
/// eave is shorter than ridge
function dropped_eave_placement(roof) {
    if ((G_FLAG.g_symmetric) || (G_FLAG.g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }
    // We already flip the image, the left offset = 0,  . 
    // Process rows: 
    start_y = CV.cv_invert_start_y;
    
    console.log("total rows" + CV.cv_total_rows);
    for (let row = 0; row < CV.cv_total_rows; row++) {
        var y1 = (start_y + row * SS_CONFIG.ss_height); // use this y1.
        var y2 = (start_y + row * SS_CONFIG.ss_height + SS_CONFIG.ss_height);
        if (row < G_FLAG.g_dropped_eave_lower_part_rows) {
            let [x_btm_right, x_top_right] = get_right_coord(roof, y1, y2);
            var x_btm_left = CV.cv_left_gap_x;
            var x_top_left = CV.cv_left_gap_x;
            var usable_width = x_btm_right - x_btm_left;
            var ss_per_row = Math.floor(usable_width / SS_CONFIG.ss_width);
            var start_x = x_btm_left;
            var ss_length = ss_per_row * SS_CONFIG.ss_width;
            get_ss_per_row(ss_per_row, SS_CONFIG, start_x, y1, y2);
            console.log("row " + row);
            var tmp = start_x + ss_length;
            console.log("x_btm_right  " + x_btm_right + " end of SS is  " + tmp);
        }
        else {
            var x_btm_left = CV.cv_left_gap_x;

            var x_btm_right = roof.ridge - SS_CONFIG.left_right_ss_offset;// CV.cv_right_gap_x; 
            var usable_width = x_btm_right - x_btm_left;
            var ss_per_row = Math.floor(usable_width / SS_CONFIG.ss_width);
            var start_x = x_btm_left;
            var ss_length = ss_per_row * SS_CONFIG.ss_width;
            get_ss_per_row(ss_per_row, SS_CONFIG, start_x, y1, y2);
            console.log("long row " + row);
            var tmp = start_x + ss_length;
            console.log("x_btm_right  " + x_btm_right + " end of SS is  " + tmp);
        }
       
        if (row == (CV.cv_total_rows - 1)) {
            cv_max_ss_in_row = ss_per_row;
        }     
    }
    if (G_FLAG.g_flipped) {
        flip_left_right(roof);
    }
}
 
//// Draw() function 
function draw() {
    const canvas = document.querySelector('#canvas');
    if (canvas.getContext) {
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var y_upper = CV.cv_real_height + SS_CONFIG.drawing_offset;

        console.log("height " + canvas.height);
        console.log("y_upper " + y_upper);
        //drawLine(ctx, [100, 100], [100, 300], 'green', 5);
        for (let i = 0; i < 4; i++) {
            drawLine(ctx, [four_corners[i][0], y_upper - four_corners[i][1]], [four_corners[(i + 1) % 4][0], y_upper - four_corners[(i+1)%4][1]], 'green', 3);
        }
        if (G_FLAG.g_dropped_eave) {
            for (let i = 0; i < 6; i++) {
                drawLine(ctx, [six_corners[i][0], y_upper - six_corners[i][1]], [six_corners[(i + 1) % 6][0], y_upper - six_corners[(i + 1) % 6][1]], 'green', 3);

            }
        }
        //if (!g_max_fit) {
        //    drawLine(ctx, [cv_ref_line_x, SS_CONFIG.drawing_offset], [cv_ref_line_x, CV.cv_real_height + SS_CONFIG.drawing_offset], 'red', 2);
        //}
       
        //drawLine(ctx, [cv_invert_mid_x, SS_CONFIG.drawing_offset], [cv_invert_mid_x, CV.cv_real_height + SS_CONFIG.drawing_offset], 'green', 2);
        
        //drawLine(ctx, [cv_invert_mid_x - SS_CONFIG.ss_width/2, SS_CONFIG.drawing_offset], [cv_invert_mid_x-SS_CONFIG.ss_width/2, CV.cv_real_height + SS_CONFIG.drawing_offset], 'yellow', 2);
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
                        fill_area(ctx, y_upper, one_ms, 'blue', 2, 'gray');
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

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000066';
    ctx.stroke(circle); // <<< pass circle here too
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
    ctx.moveTo(pts[0], y_upper- pts[1]);
    for (let i = 2; i < pts.length; i=i+2) {
        ctx.lineTo(pts[i], y_upper - pts[i + 1]);
    }
    ctx.lineTo(pts[0], y_upper - pts[1]);
     
    ctx.stroke();

    ctx.fillStyle = fill;
    ctx.fill();
    console.log("Four corners (x, y) ");
    for (let i = 0; i < pts.length; i = i + 2) {
        var num_x = pts[i];
        var num_y = pts[i + 1];
        //Number(num_x).toFixed(2);
        //Number(num_y).toFixed(2);
        console.log(Number(num_x).toFixed(2) + "  " + Number(num_y).toFixed(2));
    }
    var btm_x = Math.abs(pts[0] - pts[6]);
    var top_x = Math.abs(pts[2] - pts[4]);

    console.log(" Metal width " +Number(btm_x).toFixed(2) + " , " + Number(top_x).toFixed(2));
}

/// For Input Data.... 
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



function checkWidth() {
     
    if (roof.eave + roof.stage_length > roof.ridge) {
        console.log("Error, need to stop !");
         
        var dropped_eave = document.getElementById('dropped_eave');
        dropped_eave.value = Number(document.getElementById('ridge').value) - Number(document.getElementById('eave').value);
        return false;
    }
    else {
        return true;
    }
}
/// In HTML code, use change event to set default values of offsets 
/// This may reduce the problem of wrong offsets.
/// Get data from textbox on webpage.
/// Calling check_input is not needed as data field is set to number type only. 
function read_data() {
    var status_left_offset = false;
    var status_right_offset = false;

    var eave = document.getElementById('eave').value;
    var ridge = document.getElementById('ridge').value;
    var dropped_eave = document.getElementById('dropped_eave').value;

    //var left_offset = document.getElementById('left_offset').value;
    //var right_offset = document.getElementById('right_offset').value;
    var height_measured = document.getElementById('height_measured').value;
    var height_measured_real = document.getElementById('height_measured_real').value;
    var stage_height_measured = document.getElementById('stage_height_measured').value;
    var stage_height_measured_real = document.getElementById('stage_height_measured_real').value;
    var pitch_rise = document.getElementById('pitch_rise').value;
    console.log("read data as " + eave + "   " + ridge);
    //console.log("read data as " + left_side + "   " + right_side);
    //console.log("left_offset : " + left_offset + " right_offset: " + right_offset);
    //console.log("height measured " + height_measured + " pitch_rise:  " + pitch_rise);
    console.log("Height_measured !! " + height_measured);
    console.log("Stage_Height_measured !! " + stage_height_measured);
    console.log("Height_measured real !! " + height_measured_real);
    console.log("stage_Height_measured real !! " + stage_height_measured_real);
    if (check_input(eave) == false) {
        return;
    }
    if (check_input(ridge) == false) {
        return;
    }
    if (check_input(dropped_eave) == false) {
        return;
    }
    //if (check_input(left_offset) == false) {
    //    return;
    //}
    //if (check_input(right_offset) == false) {
    //    return;
    //}
    //if (check_input(left_height_measured) == false) {
    //    return;
    //}
    if (check_input(pitch_rise) == false) {
        return;
    }

    roof.eave = Number(eave);
    roof.ridge = Number(ridge);
    roof.dropped_eave = Number(dropped_eave);

    //if (left_offset == "") {
    //    status_left_offset = false;
    //    console.log("left_offset is null ");
    //}
    //else {
    //    status_left_offset = true;
    //    console.log("left_offset has value ");
    //}

    //if (right_offset == "") {
    //    status_right_offset = false;
    //    console.log("right_offset is null ");
    //}
    //else {
    //    status_right_offset = true;
    //    console.log("Right offset has value ");
    //}
    //roof.left_offset = Number(left_offset);
    //roof.right_offset = Number(right_offset);
    roof.height_measured = Number(height_measured);
    roof.height_measured_roof = Number(height_measured_real);
    roof.stage_height_measured = Number(stage_height_measured);
    roof.stage_height_measured_roof = Number(stage_height_measured_real);


    if ((roof.height_measured == 0) && (roof.height_measured_roof == 0)) {
        console.log("Error: Height of Roof is 0 ");
        alert("You need to enter the value for the height of the roof...! ");
    }
 
    // cannot be the same value for left and right side when it is not zero.
    if ((roof.height_measured == roof.stage_height_measured) && (roof.height_measured > 0)) {
        console.log("Error: Height of Roof is not correct ");
        alert("You need to enter the values for the height of the roof. The height of roof and the stage height value cannot be the same..! ");
    }
    if ((roof.height_measured_roof == roof.stage_height_measured_roof) && (roof.height_measured_roof > 0)) {
        console.log("Error: Height of Roof is not correct ");
        alert("You need to enter the values for the height of the roof. The height of roof and the stage height value cannot be the same..! ");
    }
    pitch_rise_value = Number(pitch_rise);
    if (roof.height_measured == 0) {
        console.log("@@@ Pitch is set to 0")
        pitch_rise_value = 0;
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
    //if ((status_left_offset == false) && (status_right_offset == false)) {
    //    alert("You need to enter at least one of left_offset or right_offset...! ");

    //}
    //read_data_status.left_offset = status_left_offset;
    //read_data_status.right_offset = status_right_offset;
    //var style_selected = document.querySelector('input[name="_style"]:checked').value;
    //var mix_style = true;
    //if ((roof.left_offset > 0) && (roof.right_offset > 0)) {
    //    mix_style = false;
    //}

    //var style = Number(style_selected);
    var style = 3; // fix to 3 for dropped eave.
    console.log('selected style is ' + style);
    console.log(style);
    //if ((mix_style== false) && (style > 1)) {
    //    console.log("Cannot select this!");
    //    alert("You need to use either blend or section style! ");
    //    roof.style = 0;
    //    document.getElementById('mixed').checked = false;
    //    document.getElementById('blend').checked = true;
    //}
    //roof.style = Number(style_selected);
    roof.style = style; 
    console.log(roof.style);

    var left_right = document.getElementById('hidden_label').value;
    console.log(left_right);
    console.log("stop here "); 
    if (left_right == "L") {
        G_FLAG.g_odd_shape_left = true;
    }
    else {
        G_FLAG.g_odd_shape_left = false; 
    }
    
}


///
function validate_and_update_data() {
    if (Math.abs(roof.eave - roof.ridge) < 1) {
        if ((read_data_status.left_offset == false) || (read_data_status.right_offset == false)) {
            let value = prompt("For rectangle, set offsets to 0", 0);
            document.getElementById("left_offset").value = Number(value);
            document.getElementById("right_offset").value = Number(value);
        }
        return false;
    }

    var sum = roof.eave + roof.dropped_eave;
    if (sum >  roof.ridge) {
        alert("Enter correct value for eave and dropped eave . Sum of them should be less than ridge ! ");
        var tmp_eave = roof.ridge - roof.eave;
        if (tmp_eave <= 0) {
            tmp_eave = 5;
        }
        document.getElementById("dropped_eave").value = Number(tmp_eave);
        //var tmp = roof.ridge - tmp_eave - 5;
        //if (tmp <= 0) {
        //    tmp = 5;
        //}
        //document.getElementById("eave").value = Number(tmp);

         
        return false;
    }


    return true;
    //var sum = roof.left_offset + roof.right_offset;
    //var diff = 0;
    //if (roof.eave > roof.ridge) {
    //    diff = roof.eave - roof.ridge;
    //}
    //else if (roof.eave < roof.ridge) {
    //    diff = roof.ridge - roof.eave;
    //    normal_shape = false;
    //}
    //var diff_offset = diff - sum;
    //if (diff_offset < 0) {
    //    alert("Enter correct left and right offset. Sum of offsets is too large! Set to 0!");
    //    document.getElementById("left_offset").value = Number(0);
    //    document.getElementById("right_offset").value = Number(0);
    //    roof.left_offset = Number(0);
    //    roof.right_offset = Number(0);
    //    return;
    //}
    //if (Math.abs(diff_offset) > 1) {
    //    console.log("In validate (), " + read_data_status.left_offset + " ,  " + read_data_status.right_offset); 
    //    if (read_data_status.left_offset) {
    //        var temp = diff - roof.left_offset;
    //        let value = prompt("To ensure left and right offset are correct, enter right offset value ", temp);
    //        if (value == null || value == "") {
    //            text = "User cancelled the prompt";
    //        }
    //        else {
    //            text = "User enter value";
    //            document.getElementById("right_offset").value = Number(value);
    //            // update right_offset value!!!
    //            roof.right_offset = Number(value);
    //        }
    //    }
    //    else if (read_data_status.right_offset) { // right offset is set.
    //        var temp = diff - roof.right_offset;
    //        let value = prompt("To ensure left and right offset are correct, enter left offset value ", temp);
    //        if (value == null || value == "") {
    //            text = "User cancelled the prompt";
    //        }
    //        else {
    //            text = "User enter value";
    //            document.getElementById("left_offset").value = Number(value);
    //            // update left_offset value!!!
    //            roof.left_offset = Number(value);
    //        }
    //    }
    //    else {
    //        console.log("validate_and_udapte_data() both offsets are not set ");
    //        var temp = diff;
    //        let value = prompt("Program set left offset value as ", temp);
    //        if (value == null || value == "") {
    //            text = "User cancelled the prompt";
    //        }
    //        else {
    //            text = "User enter value";
    //            document.getElementById("left_offset").value = Number(value);
    //            document.getElementById("right_offset").value = Number(0);
                
    //            // update right_offset value!!!
    //            roof.left_offset = Number(value);
    //            roof.right_offset = Number(0);
    //        }
    //    }
    //}
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
         
    }

    G_FLAG.g_data_is_valid = v; 
    read_data_status.left_offset = true;
    read_data_status.right_offset = true;

    console.log("roof info update:   ");
    console.log("read data as " + roof.eave + "   " +  roof.ridge);
    // console.log("read data as " + roof.left_side + "   " +  roof.right_side);
    console.log("left_offset : " +  roof.left_offset + " right_offset: " +  roof.right_offset);
    console.log("height measured " +  roof.height_measured + " angle:  " +  roof.angle);
}


/// Save data to json.
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
