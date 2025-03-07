/// Copyright(C) 2023 - 2033 Solarshingle Canada - All Rights Reserved
/// For calculating number of Singles in a roof of trapezoidal shape.
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
const sec_min_short_hori_edge = 6; // min horizontal edge length.
const sec_ms_fix_width = 27.7953; // 706mm

//// Special offsets for mix-style
const mix_left_edge_offset = 2; 
const odd_shape_left = true; 


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
var g_max_fit = false; // when it is true, try to fit max num of shingles even it is not symmetric.
var g_flipped = false;
var g_vertical_line = false; // if one side is vertical edge or not.

var g_no_metal_on_vert_edge = false; //User can select if use metal shingle next to the vertical edge or not, if there is one.
var g_dropped_eave = false;
var g_dropped_eave_lower_part_rows = 0;
var g_odd_shape_left = true; 

/// computed values
var cv_real_height = 1;
var cv_real_dropped_eave_height = 1; 
var cv_real_left_side = 1;
var cv_real_right_side = 1;
var cv_ref_line_x = 0;
var cv_left_gap_x = 0;  // left offset length. This value is to help determine the area of SS, 
                       // it is the hypotenuse of right angle triangle and > left_right_ss_offset.
var cv_right_gap_x = 0; // right offset length.
var cv_total_rows = 0;
var cv_invert_start_y = 0;
var cv_max_ss_in_row = 0;
var cv_tilting_offset = 0;

// section style related:
var cv_sec_left_gap_x = 0; 
var cv_sec_right_gap_x = 0;
var cv_sec_invert_start_y = 0; 
var cv_sec_total_rows = 0; 

// variables for dropped eave roof
 
var cv_dropped_eave_x = 0; // need to get this point as x
var cv_dropped_eave_y = 0; // this can be found by difference of 2 sides. 

//var cv_mid_x = 0; // The middle point of either eave or ridge of a non-symmetrical shape
var cv_left_outside = 0; // at current y (height), the width of outside of the roof.
var cv_right_outside = 0;
//var cv_invert_mid_x = 0;
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
    dropped_eave: 100,
    stage_length: 100, // actually the width (horizontal)
    left_height_measured: 220,
    left_height_measured_roof: 220,
    right_height_measured: 220,
    right_height_measured_roof: 220,
    stage_height_measured: 100,
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
    if (g_data_is_valid == false) {
        alert("Data is not valid.. stop");
        return;
    }
    if (roof.heaght_measured == 0) {

        roof.angle = 0;
    }
    set_g_variable();
    if ((roof.eave + roof.dropped_eave) < roof.ridge) {
        g_dropped_eave = true;
        if (g_odd_shape_left == false) {
            g_flipped = true; 
        }
         
    }
    else {
        g_dropped_eave = false;
        alert("The parameters given cannot be used for dropped eave roof. Please try again... ")
        return;
    }
    //console.log("start...... ");
    //console.log(four_corners[0][1]);
    //console.log(four_corners[3][1]);
    //four_corners[0][0] = 100;
    //console.log("changed  " + four_corners[0][0]);
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
    g_symmetric = symm;
    var rect = check_rectangle(roof);
    console.log("Rectangle " + rect);
    g_rectangle = rect;
    g_normal_trapezoidal = check_normal_trapezoidal(roof);
    console.log("Normal trapezoidal ");
    console.log(g_normal_trapezoidal);

    display_inputs(roof);
    if (g_odd_shape_left) {
        cv_real_height = find_real_height(roof.angle, roof.height_measured, roof.height_measured_roof);
        cv_real_dropped_eave_height = find_real_height(roof.angle, roof.stage_height_measured, roof.stage_height_measured_roof);
        cv_real_left_side = cv_real_height;
        cv_real_right_side = cv_real_dropped_eave_height;
    }
    else {
        cv_real_height = find_real_height(roof.angle, roof.height_measured, roof.height_measured_roof);
        cv_real_dropped_eave_height = find_real_height(roof.angle, roof.stage_height_measured, roof.stage_height_measured_roof);
        cv_real_left_side = cv_real_dropped_eave_height; 
        cv_real_right_side = cv_real_height;
    }
   
    console.log("real height " + cv_real_height);
    var total_rows = find_total_rows(cv_real_height, eave_ss_offset, ridge_ss_offset);
    console.log("Total rows  " + total_rows);
    cv_total_rows = total_rows;

    //find_real_side_length(cv_real_height, roof);
    //console.log("Real left side length ", cv_real_left_side);
    //console.log("Real right side length ", cv_real_right_side);


    //// First run to get gaps and reference line before flipping.
    //find_gaps(roof);
    ////
    //console.log("gaps in x-direction: L and R " + cv_left_gap_x + "    " + cv_right_gap_x);

    //find_ref_line(roof);
    //console.log("REF LINE IS " + cv_ref_line_x);
    cv_ref_line_x = left_right_ss_offset;

    // See if the shorter offset is wide enough to put 1 SS in it.
    // if yes, then set g_max_fit to true.
    //g_max_fit = check_short_offset(roof);
    // console.log("------- Max Fit ----- " + g_max_fit);

    //if (g_symmetric == false) {
    //    // check if need to flip
    //    if (roof.left_offset > roof.right_offset) {
    //        // flip left-right.
    //        var t = roof.left_offset;
    //        roof.left_offset = roof.right_offset;
    //        roof.right_offset = t;
    //        g_flipped = true;
    //        console.log("g_flipped set to True ");
    //    }
    //    else {
    //        g_flipped = false;
    //        console.log("g_flipped set to False ");
    //    }
    //}

    // For invert trapezoidal, check the length of eave and set g_invert_eave_short


    // flip roof if needed. Then find the following:
    // right gap, inver_start_y, number of row for trapezoidial area.
    get_dropped_eave_info(roof); 

    //if (g_normal_trapezoidal == false) {
    //    console.log("Check invert trapezoidal ");
    //    if (roof.eave == 0) {
    //        // triangle must be handled here!
    //        if (roof.style == 0) {
    //            cv_invert_start_y = first_y_for_invert_triangle(roof.style);
    //            cv_total_rows = find_total_rows(cv_real_height, cv_invert_start_y, ridge_ss_offset);
    //        }
    //        else {
    //            cv_sec_invert_start_y = first_y_for_invert_triangle(roof.style);
    //            cv_sec_total_rows = find_total_rows(cv_real_height, cv_sec_invert_start_y, sec_ridge_ss_offset);
    //        }
    //        g_invert_eave_short = true;
    //    }
    //    else { // invert trapezoidal:
    //        cv_invert_start_y = eave_ss_offset;
    //        console.log("Check invert y offset ")
    //        check_width_for_first_row(roof);
    //        if (g_invert_eave_short) {
    //            if (roof.style == 0) {
    //                cv_invert_start_y = Math.ceil(first_y_for_invert(roof, roof.style, cv_left_gap_x, cv_right_gap_x)); // also set up cv_invert_mid_x in this function. 
    //                console.log("Invert start y " + cv_invert_start_y);

    //                // re-calculate rows
    //                cv_total_rows = find_total_rows(cv_real_height, cv_invert_start_y, ridge_ss_offset);
    //            }
    //            else {
    //                console.log("TRY TO FIND Invert start y for metal ...");
    //                cv_sec_invert_start_y = Math.ceil(first_y_for_invert(roof, roof.style, cv_sec_left_gap_x, cv_sec_right_gap_x)); // also set up cv_invert_mid_x in this function. 
    //                console.log("Invert start y for metal ...  " + cv_sec_invert_start_y);

    //                // re-calculate rows
    //                cv_total_rows = find_total_rows(cv_real_height, cv_sec_invert_start_y, sec_ridge_ss_offset);
    //            }

    //        }
    //    }
    //}

    // coordinates are from flipped if any. 
    // 
    //find_corner_coord(roof, cv_real_height);
    console.log("Coordinates " + six_corners);
    //console.log("normal or invert shape " + g_normal_trapezoidal);

    //find_line_eqs_for_left_right_side(roof); // find line equations of left and right edges.
    console.log("IN TEST()   g_vertical line " + g_vertical_line); 

   
    // just swap left and right edge gaps in one function. 
    //if (g_flipped) {
    //    swap_left_right_edge_gaps();
    //}
    
    console.log("2nd run: gaps in x-direction: L and R " + cv_left_gap_x + "    " + cv_right_gap_x);

    //find_ref_line(roof);
    // console.log("REF LINE IS after flipping " + cv_ref_line_x);
    //if ((g_vertical_line) && (roof.style == 2)) {
    //    g_no_metal_on_vert_edge = true;
    //    console.log("Set g_no_metal_on_vert_edge ");
    //}

    if (g_dropped_eave) {
        dropped_eave_placement(roof);
    }
    else {
        alert("Something wrong..... ");
        return; 
    }
    //if (g_rectangle) {
    //    find_rect_ss(roof);
    //}
    //else if (g_symmetric) {
    //    if (roof.style == 0) {
    //        console.log("g_symmetric -- roof.style == 0"); 
    //        find_symm_trapezoidal_ss(roof);
    //    }
    //    else {
    //        console.log("g_symmetric -- roof.style == 1 "); 
    //        if (g_normal_trapezoidal) {
    //            ms_fixed_width_normal(roof);
    //        }
    //        else {
    //            ms_fixed_width_invert(roof);
    //        }
    //    }
    //}
    //else if (g_max_fit) {
    //    if (roof.style == 0) {
    //        console.log("g_max_fit -- roof.style == 0 "); 
    //        max_fit_ss_aligned_to_first_row(roof);
    //    }
    //    else {
    //        console.log("g_max_fit -- roof.style == 1 "); 
    //        ms_fixed_width_max_fit_ss_aligned_to_first_row(roof);
    //    }
    //}
    //else {
    //    console.log("NOT g_symmetric, NOT g_max_fit "); 
    //    if (roof.style == 0) {
    //        console.log("roof.style == 0 "); 
    //        find_non_symm_trapezoidal_ss(roof);
    //    }
    //    else if (roof.style == 1) {
    //        console.log("roof.style == 1 "); 
    //        ms_fixed_find_non_symm_trapezoidal_ref_line(roof);

    //    }
    //    else if (roof.style == 2) { // seems no need to check. But can add some checking here too!
    //        console.log("roof.style == 2 "); 
    //        mix_ms_vertical_edge(roof); // ONLY this case we mix two diff styles.
    //    }
    //}
    find_linear_inch();
}

/// Flip flag is set to true if needed,
/// Find coordinates (keep in six_corners)
/// The right gap and right side equation..
/// Find the start_y for invert trapezodial.
/// number of rows for trapezoidal areas. 
/// total rows. 
function get_dropped_eave_info(roof) {
    //if ((roof.left_height_measured < roof.right_height_measured) ||
    //    (roof.left_height_measured_roof < roof.right_height_measured_roof)) {
    //    g_flipped = true;
    //}
    //else {
    //    g_flipped = false;
    //}
    // The coordinates assume left edge > right edge.  
    // first get coordinates: 
    six_corners[0][0] = 0;
    six_corners[0][1] = 0;
    six_corners[1][0] = 0;
    six_corners[1][1] = cv_real_height;
    six_corners[2][0] = roof.ridge;
    six_corners[2][1] = cv_real_height;
    six_corners[3][0] = roof.ridge;
    six_corners[3][1] = cv_real_height - cv_real_dropped_eave_height;
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
    right_side_eq.vert = false;
    k = (y2 - y1) / (x2 - x1);
    b = y1 - k * x1;
    right_side_eq.k = k;
    right_side_eq.b = b;

    // The normal method for finding gap on left/right side using offset.
    // Here use another method:
    var x = Math.abs(x1 - x2); // the horizontal distance between 
    var y = Math.abs(y1 - y2);
    var c = Math.sqrt(x * x + y * y);
    var gap = c / y * left_right_ss_offset;
    cv_right_gap_x = gap; 
    cv_left_gap_x = left_right_ss_offset;
    // Need to find the start_y, as it will be inverted shape:
    // given x as the width of SS and 2 gaps. 
    var width = ss_width + cv_left_gap_x + cv_right_gap_x; 
    var modify = true;
    if (width < roof.eave) {
        cv_invert_start_y = eave_ss_offset;
    }
    else {
        // find y from width which is x from equation:
        var tmp_y = Math.ceil(right_side_eq.k * width + right_side_eq.b);  
        if (tmp_y < cv_dropped_eave_y) {
            cv_invert_start_y = tmp_y;
         
        }
        else {
            // cannot fit even 1 row into trapezodial area.
            cv_invert_start_y = cv_dropped_eave_y + eave_ss_offset; 
            modify = false;
        }
    }
    if (modify) {
        g_dropped_eave_lower_part_rows = Math.floor((cv_dropped_eave_y + eave_ss_offset - cv_invert_start_y) / ss_height) ; // add one row.
        // need to check if the last row (top) has enough offset from dropped eave edge or not.
        var top_edge = g_dropped_eave_lower_part_rows * ss_height + cv_invert_start_y;
        console.log("Top edge of lower part rows " + top_edge);
        if (top_edge < (cv_dropped_eave_y + eave_ss_offset)) {
            g_dropped_eave_lower_part_rows = g_dropped_eave_lower_part_rows + 1; // this is normal case... 
        }
        //// The y value 
        //var dropped_eave_with_offset = cv_dropped_eave_y + eave_ss_offset;
        //// this will shift start_y upward a bit, by fixing the number of rows and the offset given. 
        //if (top_edge < dropped_eave_with_offset) {
        //    cv_invert_start_y = cv_dropped_eave_y + eave_ss_offset - g_dropped_eave_lower_part_rows * ss_height;
        //}
    }
    cv_total_rows = Math.floor((cv_real_height - cv_invert_start_y) / ss_height);

}
/////// Utility Functions 
/// This function is to swap left and right if needed.
/// Re-calculate is also possible.
/// May be no need to swap the real-left-side
function swap_left_right_edge_gaps() {
    var temp = cv_left_gap_x;
    cv_left_gap_x = cv_right_gap_x;
    cv_right_gap_x = temp;
    temp = cv_sec_left_gap_x;
    cv_sec_left_gap_x = cv_sec_right_gap_x;
    cv_sec_right_gap_x = temp; 
    // cv_real_left_side
}


/// Functions needed in test(). 
/// Arranged in alphabetic order
/// This function is only for invert trapezoidal.
/// set g_invert_eave_short = true if it is shorter than one SS. 
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


// Check if the shorter offset greater than 1 ss or not. 
function check_short_offset(roof) {
    if (g_symmetric) {
        console.log("Symmetric Shape Does Not Need this check");
        return false;
    }
    // based on shape is normal or inverted.
    if (g_normal_trapezoidal) {
        // need to handle left and right offset:
        var h = ss_height + eave_ss_offset;
        if (g_left_ref_line) { // left offset is shorter than right offset
            // at the top of the first row, the x value from 0 to left side of shingle 
            // should be <= left offset - (left_gap + width of 1 shingle).
            // x = Left_offset * shingle_height / Roof_Height. 
            console.log("left offset " + roof.left_offset);
            console.log("left gap " + cv_left_gap_x);
            console.log("h " + h);
            console.log("real height " + cv_real_height);
            var x = compare_offset_with_shingle_width(roof, roof.left_offset, cv_left_gap_x, h);
            console.log("1. true or false " + x);
            return x;
        }
        else { // right offset is shorter... 
            var x = compare_offset_with_shingle_width(roof, roof.right_offset, cv_right_gap_x, h);
            console.log("2. true or false " + x);
            return x;
        }
    }
    else { // inverted trapezoidal/triangle
        var h = ss_height + ridge_ss_offset;
        if (g_left_ref_line) {
            var x = compare_offset_with_shingle_width(roof, roof.left_offset, cv_left_gap_x, h);
            return x;
        }
        else {
            var x = compare_offset_with_shingle_width(roof, roof.right_offset, cv_right_gap_x, h);
            return x;
        }
    }
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


function check_width_for_first_row(roof) {
    var t1 = roof.eave - cv_left_gap_x - cv_right_gap_x - ss_width;

    console.log("t1 " + t1);
    if (t1 < 0) {
        g_invert_eave_short = true;
    }
    else {
        g_invert_eave_short = false;
    }

}


/////////////// Code to check if we can put one shingle on the unused side of reference line.
/////////////// This will maximize the shingles. 
function compare_offset_with_shingle_width(roof, offset, edge_gap, row_height) {
    console.log("Real height" + cv_real_height);
    var x = offset * row_height / cv_real_height;
    var t = offset - x;
    console.log("Inside width " + t);
    console.log("Edge gap" + edge_gap);

    if (t > (edge_gap + ss_width)) {
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


/// Need to use actual height instead of height measured from map. 
function find_corner_coord(roof, actual_height) {
    if (g_rectangle) {
        four_corners[0][0] = 0;
        four_corners[0][1] = 0;
        four_corners[1][0] = 0;
        four_corners[1][1] = actual_height;
        four_corners[2][0] = roof.ridge;
        four_corners[2][1] = actual_height;
        four_corners[3][0] = roof.eave;
        four_corners[3][1] = 0;
    }
    else {
        if (g_symmetric) {
            if (roof.eave > roof.ridge) {
                g_normal_trapezoidal = true;
                // Isosceles Trapezoidal
                four_corners[0][0] = 0;
                four_corners[0][1] = 0;
                four_corners[1][0] = roof.left_offset;
                four_corners[1][1] = actual_height;
                four_corners[2][0] = roof.left_offset + roof.ridge;
                console.log("In find_corner_coord: " + roof.left_offset + "         " + roof.ridge);
                console.log("In find_corner_coord: " + four_corners[2][0]);
                four_corners[2][1] = actual_height;
                four_corners[3][0] = roof.eave;
                four_corners[3][1] = 0;
            }
            else {
                g_normal_trapezoidal = false;
                four_corners[0][0] = roof.left_offset;
                four_corners[0][1] = 0;
                four_corners[1][0] = 0;
                four_corners[1][1] = actual_height;
                four_corners[2][0] = roof.ridge;
                four_corners[2][1] = actual_height;
                four_corners[3][0] = roof.left_offset + roof.eave;
                four_corners[3][1] = 0;
            }
        }
        else { // NOT SYMMETRIC!!!!! 
            find_corner_coord_odd_shape(roof, actual_height);
        }
    }
}


/// For non-symmetric trapezoidal.
function find_corner_coord_odd_shape(roof, actual_height) {
    console.log("Call odd shape function ")
    if (roof.eave > roof.ridge) {
        // Trapezoidal
        g_normal_trapezoidal = true;
        four_corners[0][0] = 0;
        four_corners[0][1] = 0;
        four_corners[1][0] = roof.left_offset;
        four_corners[1][1] = actual_height;
        four_corners[2][0] = roof.left_offset + roof.ridge;
        four_corners[2][1] = actual_height;
        four_corners[3][0] = roof.eave;
        four_corners[3][1] = 0;
    }
    else {
        // inverted trapezoidal
        console.log("Inverted ..... ");
        g_normal_trapezoidal = false;
        four_corners[0][0] = roof.left_offset;
        four_corners[0][1] = 0;
        four_corners[1][0] = 0;
        four_corners[1][1] = actual_height;
        four_corners[2][0] = roof.ridge;
        four_corners[2][1] = actual_height;
        four_corners[3][0] = roof.left_offset + roof.eave;
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
    // these two values is obtained for section style. 
    cv_sec_left_gap_x = cv_real_left_side * sec_left_right_ss_offset / cv_real_height;
    cv_sec_right_gap_x = cv_real_right_side * sec_left_right_ss_offset / cv_real_height;
    console.log("In find_gaps");
    console.log(cv_sec_left_gap_x);
}


/// Find equations for Left & Right side
/// Use this function to get line equation. 
/// It maybe much simpler for getting x 
function find_line_eqs_for_left_right_side(roof) {
    // use four_corners[], find mid of 0 & 3, 2&3.
    var k = 0;
    var b = 0;
    var x1 = four_corners[0][0];
    var y1 = four_corners[0][1];
    var x2 = four_corners[1][0];
    var y2 = four_corners[1][1];
    console.log("find_line_eqs "); 
    console.log(x1);
    console.log(y1);
    console.log(x2);
    console.log(y2);
     
    if (Math.abs(x2 - x1) < 0.1) {
        
        left_side_eq.vert = true;
        left_side_eq.k = 10000;
        left_side_eq.b = x1;// use x1 for equation x = x1;
    }
    else {
        
        left_side_eq.vert = false;
        k = (y2 - y1) / (x2 - x1);
        b = y1 - k * x1;
        left_side_eq.k = k;
        left_side_eq.b = b;
    }

    x1 = four_corners[2][0];
    y1 = four_corners[2][1];
    x2 = four_corners[3][0];
    y2 = four_corners[3][1];
    if (Math.abs(x1 - x2) < 0.1) {
        
        right_side_eq.vert = true;
        right_side_eq.k = 10000;
        right_side_eq.b = x1; // use x1 for equation x = x1;
    }
    else {
        
        right_side_eq.vert = false;
        k = (y2 - y1) / (x2 - x1);
        b = y1 - k * x1;
        right_side_eq.k = k;
        right_side_eq.b = b;
    }
    if ((right_side_eq.vert) || (left_side_eq.vert)) {
        g_vertical_line = true;
    }
}


/// For calculating final results
function find_linear_inch() {
    if (roof.style == 0) {
        var height = cv_total_rows * ss_height;
        var width = cv_max_ss_in_row * ss_width;
        var num_ss = four_ss_corners.length / 8;
        document.getElementById('num_ss').value = num_ss;
        document.getElementById('perimeter').value = Math.ceil((2 * height + 2 * width) / 12.0);
        document.getElementById('num_ms').value = 0;
    }
    else {
        var num_ss = four_ss_corners.length / 8;
        document.getElementById('num_ss').value = num_ss;
        var len = 2 * cv_real_height + roof.eave + roof.ridge;
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


/// Use side_offset and actual height to get real_side_length.
function find_real_side_length(actual_height, roof) {
    cv_real_left_side = actual_height;
    cv_real_right_side = actual_height;
    if (roof.left_offset > 0) {
        var t = Math.sqrt(roof.left_offset * roof.left_offset + actual_height * actual_height);
        cv_real_left_side = Math.floor(t);
    }
    if (roof.right_offset > 0) {
        var t = Math.sqrt(roof.right_offset * roof.right_offset + actual_height * actual_height);
        cv_real_right_side = Math.floor(t);
    }
}


///
function find_ref_line(roof) {
    if (g_symmetric == true) {
        console.log("For symmetric shape, there is no need to find referene line. Set it to the center.");
        if (roof.eave > roof.ridge) {
            cv_ref_line_x = roof.eave / 2;
        }
        else {
            cv_ref_line_x = roof.ridge / 2;
        }

        return;
    }
    console.log("in find_ref_line " + g_normal_trapezoidal);
    if (g_normal_trapezoidal) {
        find_ref_line_normal(roof);

    }
    else {
        find_ref_line_invert(roof);
    }
}


   ///For non-symmetric trapezoidal, find reference line.
function find_ref_line_normal(roof) {
    if (g_normal_trapezoidal == false) {
        console.log("ERROR the shape is not normal ");
        return;
    }
    g_use_ref_line = true;
    console.log("##### roof.eave " + roof.eave);
    console.log("##### cv_right_gap_x" + cv_right_gap_x);
    if ((roof.left_offset == 0) || (roof.right_offset == 0)) {
        if (roof.left_offset == 0) {
            g_left_ref_line = true;
            cv_ref_line_x = 0 + left_right_ss_offset;
        }
        else if (roof.right_offset == 0) {
            g_left_ref_line = false;
            cv_ref_line_x = roof.eave - left_right_ss_offset;
            console.log("##### cv_right_gap_x" + cv_ref_line_x);
        }
    }
    else {
        if (roof.left_offset < roof.right_offset) {
            g_left_ref_line = true;
            // Find the x-direction offset. The highest position is real_height-ridge_ss_offset. 
            var offset_x = roof.left_offset * (cv_real_height - ridge_ss_offset) / cv_real_height;
            var x = offset_x + cv_left_gap_x;
            console.log("Find_ref_line()   offset x " + offset_x);
            console.log("Find_ref_line()   cv_left_gap x " + cv_left_gap_x);
            cv_ref_line_x = x;
        }
        else {
            g_left_ref_line = false;
            // Find x-distance given the distance between roof edge and SS area (i.e. gap btw two parallel lines):
            //cv_right_gap_x = cv_real_right_side * left_right_ss_offset / cv_real_height;
            // Given eave_offset, height, and distance between roof edge and SS area (as left_right_ss_offset i.e 4inch)
            // Find the x-direction offset 
            var offset_x = roof.right_offset * (cv_real_height - ridge_ss_offset) / cv_real_height;
            var x = roof.eave - (offset_x + cv_right_gap_x);
            cv_ref_line_x = x;
        }
    }

    console.log("In find_ref_line_normal " + cv_ref_line_x);
}


// For invert and non-symmetric trapezoidal, 
// the reference line(x = c) will be at the point of parallel line inside roof for SS and eave,
// without considering 2" gap from eave side. 
function find_ref_line_invert(roof) {
    if (g_normal_trapezoidal) {
        console.log("Wrong function !");
        return;
    }
    g_use_ref_line = true;
    if ((roof.left_offset == 0) || (roof.right_offset == 0)) {
        if (roof.left_offset == 0) {
            g_left_ref_line = true;
            cv_ref_line_x = 0 + cv_left_gap_x;
        }
        else if (roof.right_offset == 0) {
            g_left_ref_line = false;
            cv_ref_line_x = roof.ridge - cv_right_gap_x;
        }
        return;
    }

    if (roof.left_offset < roof.right_offset) {
        g_left_ref_line = true;
        // Find x-distance given the distance between roof edge and SS area (i.e. gap on x-axis btw two parallel lines):
        //cv_left_gap_x = cv_real_left_side * left_right_ss_offset / cv_real_height;
        // Given eave_offset, height, and distance between roof edge and SS area (as left_right_ss_offset i.e 4inch)
        // Find the x-direction offset 
        //var offset_x = roof.left_offset * (cv_real_height - left_right_ss_offset) / cv_real_height;
        // NOTE: since the offset from eave side is very small, use cv_left_gap_x is ok.  
        var x = roof.left_offset + cv_left_gap_x;
        cv_ref_line_x = x;
        console.log("g_left_ref_line " + g_left_ref_line);
        console.log("ref line x is " + cv_ref_line_x);
    }
    else {
        g_left_ref_line = false;
        // Find x-distance given the distance between roof edge and SS area (i.e. gap on x-axis btw two parallel lines):
        //cv_right_gap_x = cv_real_right_side * left_right_ss_offset / cv_real_height;
        // Given eave_offset, height, and distance between roof edge and SS area (as left_right_ss_offset i.e 4inch)
        // Find the x-direction offset 
        // In this case, ridge > eave. 
        var x = roof.ridge - roof.right_offset - cv_right_gap_x; // just consider right gap is 
        cv_ref_line_x = x;
        console.log("g_left_ref_line " + g_left_ref_line);
        console.log("ref line x is " + cv_ref_line_x);
    }
}


///TODO: merge these two functions
/// Use height (distance between eave and ridge)
function find_total_rows(actual_height, bottom_offset, top_offset) {
    var total_height = (actual_height - bottom_offset - top_offset) / ss_height;
    var total_rows = Math.floor(total_height);
    return total_rows;
}


/// First row position for invert trapezoidal when eave is shorter than the width of 1 SS.
/// This is a special case: when the eave side is very short, it may be not possible to put even 1 SS 
/// Need to put the first SS at a bit higher place (> 2 inches). 
function first_y_for_invert(roof, style, left_gap_x, right_gap_x) {
    console.log("in first y ");
    var t1 = 0;
    if (style == 0) {
        t1 = roof.ridge - cv_left_gap_x - cv_right_gap_x - ss_width;
    }
    else {
        t1 = roof.ridge - left_gap_x - right_gap_x - ss_width - 2 * sec_min_short_hori_edge;
    }

    var t2 = roof.left_offset / roof.right_offset + 1;
    var r2 = t1 / t2;
    // use r2 to find y. Relationship: H/Roff = (H-y) / R2
    var y = cv_real_height * (1 - r2 / roof.right_offset) + 1; // r2 < right_offset! 
    console.log("y " + y);

    var r1 = r2 * roof.left_offset / roof.right_offset;
    var mid = roof.ridge - r2 - right_gap_x - ss_width / 2;
    // check if it is in middle
    var temp = r1 + left_gap_x + ss_width / 2;
    if (Math.abs(temp - mid) < 1) {
        console.log("mid is ok " + mid);
        cv_invert_mid_x = mid;
        var temp = roof.ridge - r1 - r2 - left_gap_x - right_gap_x;
        console.log(" @@@@ width for first row " + temp);
    }
    else {
        console.log("ERROR, cannot find middle point" + mid);
    }
    return y;

}


// This is a special case for invert shape. It was missed. -- 2024-01-03
function first_y_for_invert_triangle(sec_style) {
    // seems both left and right ref will be the same

    var y = (ss_width + cv_left_gap_x + cv_right_gap_x) * cv_real_height / roof.ridge;
    console.log(" TRIGANGLE first y is " + y);

    var sec_y = (ss_width + cv_sec_left_gap_x + cv_sec_right_gap_x + 2 * sec_min_short_hori_edge) * cv_real_height / roof.ridge;
    y = Math.floor(y) + 1;
    sec_y = Math.floor(sec_y) + 1;
    if (sec_style) {
        return sec_y;
    }
    else {
        return y;
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
    g_vertical_line = false;
    g_no_metal_on_vert_edge = false; 
}


//// End of Utility Functions


//////// Find Number of SS in different type of shapes 
/// Rectangle roof
function find_rect_ss(roof) {
    if (g_symmetric == false) {
        console.log("Only symmetric and rectangle shape can be processed...");
        return;
    }
    // always start from eave side:
    if (g_rectangle) {
        console.log("rectangle... ")
        console.log("total rows " + cv_total_rows);

        var ss_per_row = Math.floor((roof.eave - 2 * left_right_ss_offset) / ss_width);
        console.log("ss per row " + ss_per_row);

        cv_max_ss_in_row = ss_per_row;

        // total ss length
        var ss_length = ss_per_row * ss_width;
        var start_x = ((roof.eave - ss_length) / 2);
        console.log("start x " + start_x);
        var start_y = eave_ss_offset;
        for (let row = 0; row < cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height);
            var y2 = (y1 + ss_height);
            for (let col = 0; col < ss_per_row; col++) {
                var left = (col * ss_width + start_x);
                console.log("Left " + left);
                var right = (left + ss_width);
                console.log("y1 " + y1);
                four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);

                //var p1 =[left, y1]; // bottom left
                //var p2 = [left, y2]; // top left
                //var p3 = [right, y2];
                //var p4 = [right, y1];
                //four_ss_corners.push([p1, p2, p3, p4]);
            }
            console.log("Current coodinate " + four_ss_corners.length);
        }
    }
}


/// Use the idea given by GLH，Only for normal trapezoidal.
/// find_symm_trapezoidal_ss() calls this function.
function find_normal_ss(roof) {
    var start_y = eave_ss_offset;
    console.log("find_normal_ss");
    // Process rows: 
    for (let row = 0; row < cv_total_rows; row++) {
        console.log("Row == " + row);
        var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
        var y2 = (start_y + row * ss_height + ss_height); // top of SS (level N + 1)

        var next_top = (start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).
        //var row_next = row + 1;
        //console.log("FIND_NORMAL SS, y2 is" + y2);
        // current no of SS and row_width
        //var row_width_current = find_width_of_SS(roof, roof.eave, y2, left_gap_x, right_gap_x);
        //var ss_per_row_current = Math.floor(row_width_current / ss_width);

        // no of ss on row_n2.
        var row_width = find_width_of_SS(roof, roof.eave, next_top, cv_left_gap_x, cv_right_gap_x);
        var ss_per_row = Math.floor(row_width / ss_width);


        //var ss_per_row_next = find_normal_ss_per_row(roof, start_y, row, y1, y2, cv_left_gap_x, cv_right_gap_x);
        //var next_top = Math.floor(start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).

        //var ss_per_row = ss_per_row;

        // Use ss_per_row to find ss_length. 
        var ss_length = ss_per_row * ss_width;
        var start_x = ((roof.eave - ss_length) / 2);
        console.log("start x === " + start_x);
        console.log("ss_length === " + ss_length);
        get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
        if (row == 0) {
            cv_max_ss_in_row = ss_per_row;
        }
    }
}


/// find_symm_trapezoidal_ss() call this for invert trapezoidal.
function find_invert_ss(roof) {
    start_y = cv_invert_start_y;
    console.log("Start y is " + start_y);
    console.log("Total rows in invert case: " + cv_total_rows);
    // Process rows: 
    for (let row = 0; row < cv_total_rows; row++) {
        var y1 = (start_y + row * ss_height); // use this y1.
        var y2 = (start_y + row * ss_height + ss_height);

        // at y=y1, check the width of SS area. x/h = offset/real_height;
        var row_width = find_width_of_SS(roof, roof.ridge, y1, cv_left_gap_x, cv_right_gap_x);
        console.log("row length is " + row_width);
        if (row_width <= 0) {
            console.log("A problem in code, row_width cannot be negative! ");
            return -1;
        }
        var ss_per_row = Math.floor(row_width / ss_width);

        // total ss length
        var ss_length = ss_per_row * ss_width;
        var start_x = ((roof.ridge - ss_length) / 2);
        get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
        console.log("Invert_ss()  at row "+ row + " and SS is  " + ss_per_row);
        if (row == (cv_total_rows - 1)) {
            cv_max_ss_in_row = ss_per_row;
        }
    }
}


/// symmetric trapezoidal
function find_symm_trapezoidal_ss(roof) {
    if (g_symmetric == false) {
        console.log("Only symmetric shape can be processed...");
        return;
    }
    // Two cases: normal and invert trapezoidal.
    //var start_y = eave_ss_offset;
    if (g_normal_trapezoidal) {
        // need to check if the eave is longer than at least one SS. 
        find_normal_ss(roof);
    }
    else { // invert trapezoidal.
        find_invert_ss(roof);
    }
}


/// For non-symmetric trapezoidal. Four possible cases
/// Left/right reference line and normal/invert trapezoidal
function find_non_symm_trapezoidal_ss(roof) {
    if ((g_symmetric) || (g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }
    if (g_left_ref_line) {
        var start_y = eave_ss_offset;
        if (g_normal_trapezoidal) {
            // Process rows: 
            for (let row = 0; row < cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
                var y2 = (start_y + (row + 1) * ss_height); // top of SS (level N + 1)
                var next_top = (start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).
                var row_width_next = find_width_of_SS(roof, roof.eave, next_top, cv_left_gap_x, cv_right_gap_x);
                var ss_per_row = Math.floor(row_width_next / ss_width);

                //var ss_per_row = find_normal_ss_per_row(roof, start_y, row, y1, y2, cv_left_gap_x, cv_right_gap_x);
                var ss_length = ss_per_row * ss_width;
                var start_x = cv_ref_line_x;
                get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
                if (row == 0) {
                    cv_max_ss_in_row = ss_per_row;
                }
            }
        }
        else {
            // Process rows: 
            start_y = cv_invert_start_y;
            console.log("total rows" + cv_total_rows);
            for (let row = 0; row < cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height); // use this y1.
                var y2 = (start_y + row * ss_height + ss_height);

                // at y=y1, check the width of SS area. x/h = offset/real_height;
                var row_width = find_width_of_SS(roof, roof.ridge, y1, cv_left_gap_x, cv_right_gap_x);
                console.log("row length is " + row_width);
                var ss_per_row = Math.floor(row_width / ss_width);

                // total ss length
                var ss_length = ss_per_row * ss_width;
                var start_x = cv_ref_line_x;

                get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
                console.log("Left ref, invert, Number of ss " + ss_per_row + "   ");
                if (row == (cv_total_rows - 1)) {
                    cv_max_ss_in_row = ss_per_row;
                }
            }
        }

        if (g_flipped) {
            flip_left_right(roof);
        }
    }
    else { // reference line is on the right side....  TODO: may remove this part. 
        var start_y = eave_ss_offset;
        console.log("non-symmetric, and ref_line is on the right")
        if (g_normal_trapezoidal) {
            // Process rows: 
            for (let row = 0; row < cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height);
                var y2 = (start_y + row * ss_height + ss_height);
                var next_top = (start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).
                //var ss_per_row = find_normal_ss_per_row(roof, start_y, row, y1, y2, cv_left_gap_x, cv_right_gap_x);
                // at y=y2, check the width of SS area. x/h = offset/real_height;
                var row_width = find_width_of_SS(roof, roof.eave, next_top, cv_left_gap_x, cv_right_gap_x);
                var ss_per_row = Math.floor(row_width / ss_width);

                // total ss length
                var ss_length = ss_per_row * ss_width;
                var start_x = cv_ref_line_x - ss_length; // count from right side!
                console.log("start x " + start_x);
                get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
                console.log("Right, normal, Number of ss " + ss_per_row + "   ");
                console.log("Current coodinate " + four_ss_corners.length);
                if (row == 0) {
                    cv_max_ss_in_row = ss_per_row;
                }
            }
        }
        else {
            // Process rows: 
            start_y = cv_invert_start_y;
            console.log("In non symmetric ss");
            console.log("total rows" + cv_total_rows);
            for (let row = 0; row < cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height); // use this y1.
                var y2 = (start_y + row * ss_height + ss_height);

                // at y=y1, check the width of SS area. x/h = offset/real_height;
                var row_width = find_width_of_SS(roof, roof.ridge, y1, cv_left_gap_x, cv_right_gap_x);
                console.log("row length is " + row_width);
                var ss_per_row = Math.floor(row_width / ss_width);

                // total ss length
                var ss_length = ss_per_row * ss_width;
                var start_x = cv_ref_line_x - ss_length;
                console.log("start x " + start_x);
                get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
                console.log("Right, invert, Number of ss " + ss_per_row + " at row   " + row);
                console.log("Current coodinate " + four_ss_corners.length);
                if (row == (cv_total_rows - 1)) {
                    cv_max_ss_in_row = ss_per_row;
                }
            }
        }
        if (g_flipped) {
            flip_left_right(roof);
        }
    }
}


//////// Utility functions /////////////////////
////////

function get_x(k, b, y) {
    x = (y - b) / k;
    return x;
}


///Fill four_ss_corners in a row. 
function get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2) {
    //console.log("####y1, y2 " + y1 + "   " + y2);
    for (let col = 0; col < ss_per_row; col++) {
        var left = (col * ss_width + start_x);
        var right = (left + ss_width);
        four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
        //console.log("## Col = , ## Left ## Right " + col+"   " + left + "  " + right);
    }
}


/// This function will calculate the width between left and right side of trapozoidal/triangle
/// No need to consider symmetrical or not. 
/// roof_width is always the longer one of ridge or eave. y is distance from eave. 
function calc_normal_outside_x(roof, y) {
    var x_left = roof.left_offset * y / cv_real_height;
    var x_right = roof.right_offset * y / cv_real_height;
    console.log("y = " + y + " x_left " + x_left + "x_right " + x_right);
    cv_left_outside = x_left;
    cv_right_outside = x_right;
    return [x_left, x_right];
}


function calc_invert_outside_x(roof, y) {
    var x_left = roof.left_offset * (cv_real_height - y) / cv_real_height;
    var x_right = roof.right_offset * (cv_real_height - y) / cv_real_height;
    console.log("y = " + y + " x_left " + x_left + "x_right " + x_right);
    console.log("cv_left_gap_x and cv_right_gap_x " + cv_left_gap_x + "  " + cv_right_gap_x);
    cv_left_outside = x_left;
    cv_right_outside = x_right;
    console.log("cv_left_outside  " + cv_left_outside);
    console.log("cv_right_outside  " + cv_right_outside);
    return [x_left, x_right];
}


/// Based on the y value, find the distance between two sides of area for SS. 
function find_width_of_SS(roof, roof_width, y, left_gap_x, right_gap_x) {
    if (g_rectangle) {
        console.log("Wrong function, no need to get width for SS since roof is rectangle... ");
        return -1;
    }
    var width_ss_row = 0;
    if (g_symmetric) {
        if (g_normal_trapezoidal) {
            // the x-offset given y outside of traperoidal.  // y increase, x also increases
            var x_left = roof.left_offset * y / cv_real_height;
            var x_right = roof.right_offset * y / cv_real_height;
            width_ss_row = roof_width - x_left - x_right - left_gap_x - right_gap_x;
        }
        else {
            var x_left = roof.left_offset * (cv_real_height - y) / cv_real_height;
            var x_right = roof.right_offset * (cv_real_height - y) / cv_real_height;
            width_ss_row = roof_width - x_left - x_right - left_gap_x - right_gap_x;
            console.log("y = " + y + " x_left " + x_left + "x_right " + x_right);
            console.log("cv_left_gap_x and cv_right_gap_x " + left_gap_x + "  " + right_gap_x);
        }
    }
    else {
        if (g_max_fit) {
            // need to use the same idea in symmetric case to get the usable width. 


            return 0;
        }
        if (g_use_ref_line) {
            width_ss_row = find_width_of_SS_non_sym(roof, roof_width, y, left_gap_x, right_gap_x);
        }
        else {
            console.log("Need to ger reference line info first. exit.... ");
            return -1;
        }
    }
    return width_ss_row;
}


/// Handle non-symmetric case:
function find_width_of_SS_non_sym(roof, roof_width, y, left_gap_x, right_gap_x) {
    if (g_use_ref_line == false) {
        console.log(" Need to use reference line... something not correct... exit!");
        return;
    }
    var width_ss_row = 0;
    if (g_normal_trapezoidal) {
        if (g_left_ref_line) {
            // reference line is on the left side:
            var x_right = roof.right_offset * y / cv_real_height;
            width_ss_row = roof_width - cv_ref_line_x - x_right - right_gap_x;
            console.log("1 y is " + y);
            console.log("1 cv_ref_line_x" + cv_ref_line_x);
            console.log("1 x_right value is " + x_right);
            console.log("1 cv_right_gap " + right_gap_x);
            console.log("1 In find_width_of_SS_non_sym, the width is  " + width_ss_row);
        }
        else { // ref_line on the right side.
            var x_left = roof.left_offset * y / cv_real_height;
            width_ss_row = cv_ref_line_x - x_left - left_gap_x;
            console.log("2 y is " + y);
            console.log("2 cv_ref_line_x " + cv_ref_line_x);
            console.log("2 x_left value is " + x_left);
            console.log("2 cv_left_gap " + left_gap_x);
            console.log("2  In find_width_of_SS_non_sym, the width is  " + width_ss_row);
        }
    }
    else {
        // invert shape.
        if (g_left_ref_line) {
            var x_right = roof.right_offset * (cv_real_height - y) / cv_real_height;
            width_ss_row = roof_width - x_right - right_gap_x - cv_ref_line_x;
        }
        else { // reference line is on the right side:
            var x_left = roof.left_offset * (cv_real_height - y) / cv_real_height;
            width_ss_row = cv_ref_line_x - x_left - left_gap_x;
            console.log("y is " + y);
            console.log("cv_ref_line_x" + cv_ref_line_x);
            console.log("x_left value is " + x_left);
            console.log("cv_left_gap " + left_gap_x);
            console.log("In find_width_of_SS_non_sym, the width is  " + width_ss_row);
        }
    }
    return width_ss_row;
}


////////////// Functions to process non-symmetrical shapes, and maximize the number of SS.
///
/// Because the eave side is short, we cannot use middle point to search left/right side.
function calc_max_num_ss_first_row(roof, roof_max_width, left_outside, right_outside, left_gap_x, right_gap_x) {
    // just check the length and try to fit
    var length = roof_max_width - left_outside - left_gap_x - right_outside - right_gap_x;
    var num = Math.floor(length / ss_width);
    var ss_len = num * ss_width;
    var start_x = 0;
    start_x = left_outside + left_gap_x + (length - ss_len) / 2;
    var total_num_ss = num;
    return {
        start_x,
        total_num_ss
    }
}


/// Either use the start_x of last row, or calculate start_x based on 1/2 ss_width. 
function fix_start_x_based_on_last_row(roof, left_outside, left_gap_x) {
    var half_width = ss_width / 2;
    var current_start_x = left_outside + left_gap_x;
    console.log("&&& last row x = " + last_row_info.start_x);
    console.log("&&& fix_start current_start_x = " + current_start_x);
    if (g_normal_trapezoidal) {
        if (current_start_x <= last_row_info.start_x) {
            current_start_x = last_row_info.start_x;
        }
        else {
            var offset = current_start_x - last_row_info.start_x; // > 0 always. 
            var num_half_width = Math.ceil(offset / half_width);
            current_start_x = last_row_info.start_x + num_half_width * half_width;
        }
    }
    else {
        if (current_start_x >= last_row_info.start_x) {
            current_start_x = last_row_info.start_x;
            console.log("fix_start_x: Very unlikely ");
        }
        else {
            var offset = last_row_info.start_x - current_start_x; // > 0 always.
            var num_half_width = Math.floor(offset / half_width);
            current_start_x = last_row_info.start_x - num_half_width * half_width;
            if (current_start_x <= 0) {
                console.log("ERROR:  ")
            }
        }
    }
    return current_start_x;
}


// flip all SS coordinates left-to-right. Do not change y. 
function flip_left_right(roof) {
    var max_x = 0;
    if (g_normal_trapezoidal) {
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


/// After 1st row is determined, only need to check if we can put same number
/// of ss or 1 more or 1 less 
function get_num_ss_aligned_to_last_row(roof, roof_max_width, left_outside, right_outside, left_gap_x, right_gap_x) {
    //var mid_x = roof_max_width / 2;
    //var total_length = roof_max_width - cv_left_outside - cv_left_gap_x - cv_right_outside - cv_right_gap_x;
    var current_end_x = roof_max_width - right_outside - right_gap_x;

    var last_row_end = last_row_info.start_x + last_row_info.num_ss * ss_width;
    var start_x = 0;
    var num_ss = 0;
    if (g_normal_trapezoidal) {
        var shifted_x = fix_start_x_based_on_last_row(roof, left_outside, left_gap_x);
        var end_x = Math.min(last_row_end, current_end_x);
        console.log("shifted x " + shifted_x);
        console.log("last row end  " + last_row_end);
        console.log("current_end_x " + current_end_x);
        console.log("result " + ((end_x - shifted_x) / ss_width));
        var current_num = Math.floor((end_x - shifted_x) / ss_width + 0.001);

        start_x = shifted_x;
        num_ss = current_num;
        console.log("get_num_ss result : " + num_ss);
        console.log("get_num_ss start_x : " + start_x);
        // if the current number of SS is 1, and last was 2, we may want to shift it by 1/2 width.
        if ((num_ss == 1) && (last_row_info.num_ss == 2)) {
            if (start_x <= last_row_info.start_x) {
                var end = start_x + ss_width;
                if (end < current_end_x) {
                    start_x = start_x + ss_width / 2;
                }
            }
        }
    }
    else {
        var shifted_x = fix_start_x_based_on_last_row(roof, left_outside, left_gap_x);
        var end_x = Math.max(last_row_end, current_end_x);
        console.log("shifted x " + shifted_x);
        console.log("last row end  " + last_row_end);
        console.log("current_end_x " + current_end_x);
        console.log("result " + ((end_x - shifted_x) / ss_width));
        var current_num = Math.floor((end_x - shifted_x) / ss_width + 0.001);

        start_x = shifted_x;
        num_ss = current_num;
        console.log("get_num_ss result : " + num_ss);
        console.log("get_num_ss start_x : " + start_x);
    }
    return {
        start_x,
        num_ss
    }
}


/// focus on putting the first row. 
/// This function is for max-fit case. 
function max_fit_ss_aligned_to_first_row(roof) {
    if ((g_symmetric) || (g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }

    last_row_info.num_ss = 0;
    last_row_info.start_x = 0;
    if (g_normal_trapezoidal) {
        var start_y = eave_ss_offset;

        // Process rows: 
        for (let row = 0; row < cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
            var y2 = (start_y + (row + 1) * ss_height); // top of SS (level N + 1)
            // determine the length of outside of trapezoidal.
            calc_normal_outside_x(roof, y2);
            console.log("Current ROW is " + row);
            console.log("Last row has ss:  " + last_row_info.num_ss);
            var current_x = 0;
            var current_num = 0;
            if (row == 0) {
                let { start_x, total_num_ss } = calc_max_num_ss_first_row(roof, roof.eave, cv_left_outside, cv_right_outside,
                    cv_left_gap_x, cv_right_gap_x);
                current_x = start_x;
                current_num = total_num_ss;
                cv_max_ss_in_row = total_num_ss;
            }
            else {
                let { start_x, num_ss } = get_num_ss_aligned_to_last_row(roof, roof.eave, cv_left_outside, cv_right_outside,
                    cv_left_gap_x, cv_right_gap_x);
                current_x = start_x;
                current_num = num_ss;
            }
            console.log("row = " + row + " start_x =  " + current_x);
            console.log("ss_per_row " + current_num);

            last_row_info.start_x = current_x;
            last_row_info.num_ss = current_num;

            get_ss_per_row(last_row_info.num_ss, ss_width, last_row_info.start_x, y1, y2);

        }
        if (g_flipped) {
            flip_left_right(roof);
        }
    }
    else {
        // Process rows: 
        start_y = cv_invert_start_y;
        console.log("put_ss start_y " + start_y);
        console.log("put_ss total rows" + cv_total_rows);

        for (let row = 0; row < cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height); // use this y1.
            var y2 = (start_y + row * ss_height + ss_height);
            calc_invert_outside_x(roof, y1); // y1 has narrower width than y2. 
            console.log("Current ROW is " + row);
            console.log("Last row has ss:  " + last_row_info.num_ss);
            var current_x = 0;
            var current_num = 0;
            if (row == 0) {
                let { start_x, total_num_ss } = calc_max_num_ss_first_row(roof, roof.ridge, cv_left_outside, cv_right_outside,
                    cv_left_gap_x, cv_right_gap_x);
                current_x = start_x;
                current_num = total_num_ss;
            }
            else {
                let { start_x, num_ss } = get_num_ss_aligned_to_last_row(roof, roof.ridge, cv_left_outside, cv_right_outside,
                    cv_left_gap_x, cv_right_gap_x);
                current_x = start_x;
                current_num = num_ss;
            }
            console.log("row = " + row + " start_x =  " + current_x);
            console.log("ss_per_row " + current_num);

            last_row_info.start_x = current_x;
            last_row_info.num_ss = current_num;

            get_ss_per_row(last_row_info.num_ss, ss_width, last_row_info.start_x, y1, y2);

            if (row == (cv_total_rows - 1)) {
                cv_max_ss_in_row = last_row_info.num_ss;
            }
        }
        if (g_flipped) {
            flip_left_right(roof);
        }
    }
}


////// Functions for metal shingles.Starting with sec_ or ms_ 
/// Either use the start_x of last row, or calculate start_x based on 1/2 ss_width. 
function sec_fix_start_x_based_on_last_row(roof, x_btm_left, x_top_left) {
    var half_width = ss_width / 2;
    var current_start_x = x_btm_left + sec_min_short_hori_edge; // the left-most x 
    console.log("&&& last row x = " + last_row_info.start_x);
    console.log("&&& fix_start current_start_x = " + current_start_x);
    if (g_normal_trapezoidal) {
        current_start_x = x_top_left + sec_min_short_hori_edge;
        if (current_start_x <= last_row_info.start_x) {
            current_start_x = last_row_info.start_x;
        }
        else {
            var offset = current_start_x - last_row_info.start_x; // > 0 always. 
            var num_half_width = Math.ceil(offset / half_width);  // take ceiling to make sure we can get at least 1/2 ss shift. 
            current_start_x = last_row_info.start_x + num_half_width * half_width;
        }
    }
    else {
        current_start_x = x_btm_left + sec_min_short_hori_edge;
        if (current_start_x >= last_row_info.start_x) {
            current_start_x = last_row_info.start_x;
            console.log("fix_start_x: Very unlikely ");
        }
        else {
            var offset = last_row_info.start_x - current_start_x; // > 0 always.
            var num_half_width = Math.floor(offset / half_width);
            current_start_x = last_row_info.start_x - num_half_width * half_width;
            if (current_start_x <= 0) {
                console.log("ERROR:  ")
            }
        }
    }
    return current_start_x;
}


/// This function for max_fit case, with section-style. From 2nd row onwards.
function sec_get_num_ss_aligned_to_last_row(roof, roof_max_width, x_btm_left, x_top_left, x_btm_right, x_top_right) {
    //var mid_x = roof_max_width / 2;
    //var total_length = roof_max_width - cv_left_outside - cv_left_gap_x - cv_right_outside - cv_right_gap_x;
    var current_end_x = x_top_right - sec_min_short_hori_edge;
    if (x_btm_right < x_top_right) {
        current_end_x = x_btm_right - sec_min_short_hori_edge;  // invert shape.
    }

    var last_row_end = last_row_info.start_x + last_row_info.num_ss * ss_width;
    var start_x = 0;
    var num_ss = 0;
    if (g_normal_trapezoidal) {
        var shifted_x = sec_fix_start_x_based_on_last_row(roof, x_btm_left, x_top_left);
        var end_x = Math.min(last_row_end, current_end_x);
        console.log("shifted x " + shifted_x);
        console.log("last row end  " + last_row_end);
        console.log("current_end_x " + current_end_x);
        console.log("result " + ((end_x - shifted_x) / ss_width));
        var current_num = Math.floor((end_x - shifted_x) / ss_width + 0.001);

        start_x = shifted_x;
        num_ss = current_num;
        console.log("get_num_ss result : " + num_ss);
        console.log("get_num_ss start_x : " + start_x);
        console.log("top_right x: " + x_top_right);
        var gap1 = x_top_right - (start_x + ss_width);
        console.log("xxxxxx gap " + gap1);
        // if the current number of SS is 1, and last was 2, we may want to shift it by 1/2 width.
        // This part must be done with checking of end_x. 
        if ((num_ss == 1) && (last_row_info.num_ss == 2)) {
            if (start_x <= last_row_info.start_x) {
                var end = start_x + ss_width * 1.5;
                if (end < current_end_x) {
                    start_x = start_x + ss_width / 2;
                    var gap = Math.abs(start_x + ss_width - x_top_right);
                    console.log(" LAST ROW, start x" + start_x);
                    console.log(" LAST ROW, end x at " + end);
                    console.log(" LASR ROW, gap is " + gap);
                }
            }
        }
    }
    else {
        var shifted_x = sec_fix_start_x_based_on_last_row(roof, x_btm_left, x_top_left);
        var end_x = Math.max(last_row_end, current_end_x);
        console.log("shifted x " + shifted_x);
        console.log("last row end  " + last_row_end);
        console.log("current_end_x " + current_end_x);
        console.log("result " + ((end_x - shifted_x) / ss_width));
        var current_num = Math.floor((end_x - shifted_x) / ss_width + 0.001);

        start_x = shifted_x;
        num_ss = current_num;
        console.log("get_num_ss result : " + num_ss);
        console.log("get_num_ss start_x : " + start_x);
    }
    return {
        start_x,
        num_ss
    }
}


/// New function that will remove solar shingles and replace with metal shingle
/// This idea is introduced on 13/May/2024
///This dist is used to find metal shingle width.
/// Return array of two x values for y_btm, y_top, the x values indicates the maximum available length to put SS. 
/// NOTE: x value is relative to x = 0 on the left of the roof. 
function sec_get_net_dist_for_ss(roof, y_btm, y_top) {
    var x1 = get_x(left_side_eq.k, left_side_eq.b, y_btm); // x on left side with y_btm
    var x_btm_left = x1 + cv_sec_left_gap_x;

    var x2 = get_x(right_side_eq.k, right_side_eq.b, y_btm); // x value on the right side with y_btm (from x = 0)
    var x_btm_right = x2 - cv_sec_right_gap_x;

    var x3 = get_x(left_side_eq.k, left_side_eq.b, y_top);
    var x_top_left = x3 + cv_sec_left_gap_x;

    var x4 = get_x(right_side_eq.k, right_side_eq.b, y_top);
    var x_top_right = x4 - cv_sec_right_gap_x;


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

///This function is used to find the 2 corners of a row of SS.
///since only the right side will be covered by metal shingle, 
function get_right_coord(roof, y_btm, y_top) {
    var x2 = get_x(right_side_eq.k, right_side_eq.b, y_btm); // x value on the right side with y_btm (from x = 0)
    var x_btm_right = x2 - cv_sec_right_gap_x;
    var x4 = get_x(right_side_eq.k, right_side_eq.b, y_top);
    var x_top_right = x4 - cv_sec_right_gap_x;
    return [x_btm_right, x_top_right]; 
}
/// Find the number of SS can be put into the first row. 
/// Need to make 6 inches offset for metal shingles. 
function sec_calc_max_num_ss_first_row(roof, roof_max_width, x_btm_left, x_top_left, x_btm_right, x_top_right, invert) {
    // just check the length and try to fit
    if (invert == false) {
        var length = x_top_right - x_top_left - 2 * sec_min_short_hori_edge; // this must be > 0. 
        if (length < 0) {
            var start_x = 0;
            var total_num_ss = 0;
            return {
                start_x,
                total_num_ss
            };
        }
        var num = Math.floor(length / ss_width);
        var ss_len = num * ss_width;
        var start_x = 0;
        start_x = x_top_left + sec_min_short_hori_edge + (length - ss_len) / 2;
        var total_num_ss = num;
        return {
            start_x,
            total_num_ss
        }
    }
    else {
        var length = x_btm_right - x_btm_left - 2 * sec_min_short_hori_edge; // this must be > 0. 
        if (length < 0) {
            var start_x = 0;
            var total_num_ss = 0;
            return {
                start_x,
                total_num_ss
            };
        }
        var num = Math.floor(length / ss_width);
        var ss_len = num * ss_width;
        var start_x = 0;
        start_x = x_btm_left + sec_min_short_hori_edge + (length - ss_len) / 2;
        var total_num_ss = num;
        return {
            start_x,
            total_num_ss
        }
    }
}
 

/// Function to handle fixed width metal shingles.
/// This is for normal symmetrical trapezoidal shape.
/// If the gap between SS and roof edge is less than 6 inches,
/// remove 1 SS, and each end of the row will get 1/2 width of SS.
/// If the bottom edge of metal shingle is longer than 1 ss_width,
/// Need to use 2 metal shingles. One with 6 inches top edge, another covers the remaining space.
function ms_fixed_width_normal(roof) {
    var start_y = sec_eave_ss_offset;

    // Process rows: 
    var sec_cv_total_rows = find_total_rows(cv_real_height, sec_eave_ss_offset, sec_ridge_ss_offset);
    console.log("find_normal_ss in metal...");
    console.log(sec_cv_total_rows);
    for (let row = 0; row < sec_cv_total_rows; row++) {

        var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
        var y2 = (start_y + row * ss_height + ss_height); // top of SS (level N + 1)

        //var next_top = (start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).

        console.log("FIND_NORMAL SS, y2 is" + y2);

        // use equation to get x values
        let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_net_dist_for_ss(roof, y1, y2);
        var usable_width = Math.abs(x_top_right - x_top_left);
        console.log("At row, " + row + "  Usable width is " + usable_width);
        //var row_width = find_width_of_SS(roof, roof.eave, next_top, cv_sec_left_gap_x, cv_sec_right_gap_x);
        var ss_per_row = Math.floor(usable_width / ss_width);
        if ((usable_width - ss_per_row * ss_width) < (2 * sec_min_short_hori_edge)) {
            ss_per_row = ss_per_row - 1;
        }

        // Use ss_per_row to find ss_length. 
        var ss_length = ss_per_row * ss_width;
        var start_x = ((roof.eave - ss_length) / 2); // start_x is measured from x = 0 in this case! 
        console.log(" ss_per row  " + ss_per_row);
        get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
        if (row == 0) {
            cv_max_ss_in_row = ss_per_row;
        }
        var end_x = start_x + ss_length;
        // find the number of metal shingles on each side.
        // For this case, each side is about (usable_width - ss_length)/2
        // and just one shingle with width in the range (6 inches, ss_width);

        if (ss_length > 0) { // to avoid putting metal shingle for row without any SS!
            console.log("On ROW " + row + " finding metal SS now: ");
            ms_placement(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2);
          
        }

        console.log("end of row.... " + row);
    }

    console.log(ms_corners.length);
    return 0;
}


/// For symmetrical shapes: 
///For invert case, the offset is modified to be cv_invert_start_y. 
///And need to re-calculate the number of rows of SS.
function ms_fixed_width_invert(roof) {
    var start_y = cv_sec_invert_start_y;
    console.log("cv_sec_invert_start_Y " + cv_sec_invert_start_y);
    var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
    console.log("Start y is " + start_y);
    console.log("Total rows in invert case: " + sec_cv_total_rows);
    // Process rows: 
    for (let row = 0; row < sec_cv_total_rows; row++) {
        var y1 = (start_y + row * ss_height); // use this y1.
        var y2 = (start_y + row * ss_height + ss_height);
        let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_net_dist_for_ss(roof, y1, y2);
        var usable_width = Math.abs(x_btm_right - x_btm_left);
        console.log("At row, " + row + "  Usable width is " + usable_width);
        //var row_width = find_width_of_SS(roof, roof.eave, next_top, cv_sec_left_gap_x, cv_sec_right_gap_x);
        var ss_per_row = Math.floor(usable_width / ss_width);
        if ((usable_width - ss_per_row * ss_width) < (2 * sec_min_short_hori_edge)) {
            ss_per_row = ss_per_row - 1;
        }

        // total ss length
        var ss_length = ss_per_row * ss_width;
        var start_x = ((roof.ridge - ss_length) / 2);
        get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);

        if (row == (sec_cv_total_rows - 1)) {
            cv_max_ss_in_row = ss_per_row;
        }
        var end_x = start_x + ss_length;
        // find the number of metal shingles on each side.
        // For this case, each side is about (usable_width - ss_length)/2
        // and just one shingle with width in the range (6 inches, ss_width);
        if (ss_length > 0) {
            ms_placement_invert(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2);
            
        }
    }
    return 0;
}


/////////////////// 2024-05-20/////
/// Use this function to add condition for metal shingle (6 inches minimum width)
/// The idea implemented here is similar to symmetrical case.
/// No documentation given yet.
/// For 2 metal shingles, add a condition: the gap between roof edge and end of SS should be larger than 12 inches.
/// This ensures that both metal shingle's width is greater than 6 inches. 
/// 
function ms_fixed_width_max_fit_ss_aligned_to_first_row(roof) {
    if ((g_symmetric) || (g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }
    console.log("roof info left offset " + roof.left_offset + " And right offset " + roof.right_offset);
    last_row_info.num_ss = 0;
    last_row_info.start_x = 0;
    if (g_normal_trapezoidal) {
        var start_y = sec_eave_ss_offset;
        var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
        // Process rows: 
        for (let row = 0; row < sec_cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
            var y2 = (start_y + (row + 1) * ss_height); // top of SS (level N + 1)
            // determine the length of outside of trapezoidal.
            let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_net_dist_for_ss(roof, y1, y2);

            //calc_normal_outside_x(roof, y2);
            console.log("Current ROW is " + row);
            console.log("Last row has ss:  " + last_row_info.num_ss);
            var current_x = 0;
            var current_num = 0;
            if (row == 0) {
                var invert = false;
                let { start_x, total_num_ss } = sec_calc_max_num_ss_first_row(roof, roof.eave, x_btm_left, x_top_left, x_btm_right, x_top_right, invert);
                current_x = start_x;
                current_num = total_num_ss;
                cv_max_ss_in_row = total_num_ss;
            }
            else {
                let { start_x, num_ss } = sec_get_num_ss_aligned_to_last_row(roof, roof.eave, x_btm_left, x_top_left, x_btm_right, x_top_right);

                current_x = start_x;
                current_num = num_ss;
            }
            console.log("row = " + row + " start_x =  " + current_x);
            console.log("ss_per_row " + current_num);

            // update last_row_info for SS.
            last_row_info.start_x = current_x;
            last_row_info.num_ss = current_num;

            get_ss_per_row(last_row_info.num_ss, ss_width, last_row_info.start_x, y1, y2);
            if (last_row_info.num_ss > 0) {
             
                var ss_length = last_row_info.num_ss * ss_width;
                var end_x = last_row_info.start_x + ss_length; // last SS
                var start_x = last_row_info.start_x;
                ms_placement(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2);
            

            }

        }
        console.log("Num metal rows " + ms_corners.length);
        console.log(" last ms_corners value " + ms_corners[ms_corners.length - 1].length);

        if (g_flipped) {
            flip_left_right(roof);
        }
    }
    else {
        // Process rows: 
        start_y = cv_sec_invert_start_y;
        console.log("Invert case start_y " + start_y);

        var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
        for (let row = 0; row < sec_cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height); // use this y1.
            var y2 = (start_y + row * ss_height + ss_height);

            let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_net_dist_for_ss(roof, y1, y2);
            // calculate the length of outside of shape (from image border) 
            // and get values of cv_left_outside, and cv_right_outside at given y. 
            calc_invert_outside_x(roof, y1); // y1 has narrower width than y2. 
            console.log("Current ROW is " + row);
            console.log("Last row has ss:  " + last_row_info.num_ss);
            var current_x = 0;
            var current_num = 0;
            if (row == 0) {
                var invert = true;
                let { start_x, total_num_ss } = sec_calc_max_num_ss_first_row(roof, roof.ridge, x_btm_left, x_top_left, x_btm_right, x_top_right, invert);
                current_x = start_x;
                current_num = total_num_ss;
            }
            else {
                let { start_x, num_ss } = sec_get_num_ss_aligned_to_last_row(roof, roof.ridge, x_btm_left, x_top_left, x_btm_right, x_top_right);

                current_x = start_x;
                current_num = num_ss;
            }
            console.log("row = " + row + " start_x =  " + current_x);
            console.log("ss_per_row " + current_num);

            last_row_info.start_x = current_x;
            last_row_info.num_ss = current_num;

            get_ss_per_row(last_row_info.num_ss, ss_width, last_row_info.start_x, y1, y2);

            if (row == (sec_cv_total_rows - 1)) {
                cv_max_ss_in_row = last_row_info.num_ss;
            }

            if (last_row_info.num_ss > 0) {
             
                var ss_length = last_row_info.num_ss * ss_width;
                var end_x = last_row_info.start_x + ss_length; // last SS
                var start_x = last_row_info.start_x;
                ms_placement_invert(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2);
                
            }
        }
        if (g_flipped) {
            flip_left_right(roof);
        }
    }
}


/// For processing non-symmetrical trapezoidal 
/// And assume left offset is shorter than SS. 
function ms_fixed_find_non_symm_trapezoidal_ref_line(roof) {
    if ((g_symmetric) || (g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }
    // If we already flip the image, the left offset < right offset. 
    if (g_left_ref_line) {
        if (g_normal_trapezoidal) {
            var start_y = sec_eave_ss_offset;
            var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
            // Process rows: 
            for (let row = 0; row < sec_cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
                var y2 = (start_y + (row + 1) * ss_height); // top of SS (level N + 1)
                //var next_top = (start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).
                let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_net_dist_for_ss(roof, y1, y2);
                // The usable width is from reference line. But if the gap between left edge to reference line is < 6 inch
                // Need to shift starting SS by 1 ss_width.
                // var row_width_next = find_width_of_SS(roof, roof.eave, next_top, cv_sec_left_gap_x, cv_sec_right_gap_x);
                // Need to check if ref_line and x_top_left has 6 inch gap.
                var left = cv_ref_line_x - x_top_left;
                var usable_width = x_top_right - cv_ref_line_x - sec_min_short_hori_edge;
                var shift_ss = false;
                if (left < sec_min_short_hori_edge) {
                    usable_width = usable_width - ss_width / 2;
                    shift_ss = true;
                }

                var ss_per_row = Math.floor(usable_width / ss_width);
                var start_x = cv_ref_line_x;
                if (shift_ss) { // most likely shift 1/2 ss_width.
                    start_x = start_x + ss_width / 2;
                }
                //var ss_per_row = find_normal_ss_per_row(roof, start_y, row, y1, y2, cv_left_gap_x, cv_right_gap_x);
                var ss_length = ss_per_row * ss_width;

                get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
                if (row == 0) {
                    cv_max_ss_in_row = ss_per_row;
                }
                if (ss_length > 0) {
                    var end_x = start_x + ss_length; // last SS
                    ms_placement(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2);
                }
            }
            if (g_flipped) {
                flip_left_right(roof);
            }
        }
        else {
            // Process rows: 
            start_y = cv_invert_start_y;
            var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
            console.log("total rows" + sec_cv_total_rows);
            for (let row = 0; row < sec_cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height); // use this y1.
                var y2 = (start_y + row * ss_height + ss_height);
                let [x_btm_left, x_top_left, x_btm_right, x_top_right] = sec_get_net_dist_for_ss(roof, y1, y2);
                var left = cv_ref_line_x - x_btm_left;
                var usable_width = x_btm_right - cv_ref_line_x - sec_min_short_hori_edge;
                var shift_ss = false;
                if (left < sec_min_short_hori_edge) {
                    usable_width = usable_width - ss_width / 2;
                    shift_ss = true;
                }
                // at y=y1, check the width of SS area. x/h = offset/real_height;
                //var row_width = find_width_of_SS(roof, roof.ridge, y1, cv_sec_left_gap_x, cv_sec_right_gap_x);
                //console.log("row length is " + row_width);
                var ss_per_row = Math.floor(usable_width / ss_width);
                var start_x = cv_ref_line_x;
                if (shift_ss) {
                    start_x = start_x + ss_width / 2;
                }
                // total ss length
                var ss_length = ss_per_row * ss_width;
                
                get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
                console.log("Left ref, invert, Number of ss " + ss_per_row + "   ");
                if (row == (cv_total_rows - 1)) {
                    cv_max_ss_in_row = ss_per_row;
                }

                if (ss_length > 0) {
                    var end_x = start_x + ss_length; // last SS
                    ms_placement_invert(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2);
                }
            }
            if (g_flipped) {
                flip_left_right(roof);
            }
        }
    }
}


/// Mix "blend" and "section" methods.
/// For vertical edge side, no metal shingle is needed. The solar shingles will put next to the edge.
/// (Use 2 inches gap)
/// For other side, use metal shingles to cover the area between solar shingles and roof edge.
/// For processing non-symmetrical trapezoidal with vertical left edge
/// If Right edge is vertical, the shape is flipped first.
function mix_ms_vertical_edge(roof) {
    if ((g_symmetric) || (g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }
    if ((g_vertical_line == false) || (g_no_metal_on_vert_edge == false)) {
        console.log("Wrong branch...., exit ");
        return;
    }
    // If we already flip the image, the left offset < right offset. 
    console.log("In mix_ms, g_normal " + g_normal_trapezoidal);
    if (g_normal_trapezoidal) {
        var start_y = sec_eave_ss_offset;
        var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
        console.log("total rows  " + sec_cv_total_rows); 
        // Process rows: 
        for (let row = 0; row < sec_cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height); // bottom of SS (level N + 1) in document.
            var y2 = (start_y + (row + 1) * ss_height); // top of SS (level N + 1)
            //var next_top = (start_y + (row + 1) * ss_height + ss_height); // top of next level (level N+2).
            var x_btm_left = mix_left_edge_offset;
            var x_top_left = mix_left_edge_offset; // use this const is easy. 
            let [x_btm_right, x_top_right] = get_right_coord(roof, y1, y2);
                
            var usable_width = x_top_right - x_top_left - sec_min_short_hori_edge; // to put metal shingle, need at least 6 in width.
            // No need to consider shift 1/2 singles. 
            var ss_per_row = Math.floor(usable_width / ss_width);
            var start_x = mix_left_edge_offset;
               
            var ss_length = ss_per_row * ss_width;

            get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
            if (row == 0) {
                cv_max_ss_in_row = ss_per_row;
            }
            if (ss_length > 0) {
                var end_x = start_x + ss_length; // last SS
                mix_ms_placement(end_x,  x_btm_right, x_top_right, y1, y2);
            }
        }
        if (g_flipped) {
            flip_left_right(roof);
        }
    }
    else {
        // Process rows: 
        start_y = cv_invert_start_y;
        var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
        console.log("total rows" + sec_cv_total_rows);
        for (let row = 0; row < sec_cv_total_rows; row++) {
            var y1 = (start_y + row * ss_height); // use this y1.
            var y2 = (start_y + row * ss_height + ss_height);
            var x_btm_left = mix_left_edge_offset;
            var x_top_left = mix_left_edge_offset; // use this const is easy. 
            let [x_btm_right, x_top_right] = get_right_coord(roof, y1, y2);

            var usable_width = x_btm_right - x_top_left - sec_min_short_hori_edge;
           
            var ss_per_row = Math.floor(usable_width / ss_width);
            var start_x = mix_left_edge_offset;
            
            // total ss length
            var ss_length = ss_per_row * ss_width;

            get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
            console.log("Left ref, invert, Number of ss " + ss_per_row + "   ");
            if (row == (cv_total_rows - 1)) {
                cv_max_ss_in_row = ss_per_row;
            }

            if (ss_length > 0) {
                var end_x = start_x + ss_length; // last SS
                mix_ms_placement_invert(end_x,  x_btm_right, x_top_right, y1, y2);
            }
        }
        if (g_flipped) {
            flip_left_right(roof);
        }
    }
}


/// Two functions are used to place metal shingles on the end of SS. 
/// One for normal trapezoidal. One for invert grapezodial. 
function ms_placement(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2) {
    //var end_x = start_x + ss_length; // last SS

    var metal_1 = [];
    var metal_2 = [];
    var metal_3 = [];
    var metal_4 = [];
    var metals = [];

    // Use the same idea as in symmetrical shape:
    // since we already leave at least 6 inches gap between roof and SS, only
    // need to check if the lower edge of metal shingle is longer than SS.
    if (((start_x - x_btm_left) > ss_width) &&
        ((start_x - x_top_left) > 2.001 * sec_min_short_hori_edge)) {
        var x_mid = x_top_left + sec_min_short_hori_edge;
        metal_1.push(x_btm_left, y1, x_top_left, y2, x_mid, y2, x_mid, y1);
        metal_2.push(x_mid, y1, x_mid, y2, start_x, y2, start_x, y1);
        metals.push(metal_1, metal_2);
    }
    else {
        metal_1.push(x_btm_left, y1, x_top_left, y2, start_x, y2, start_x, y1);
        metals.push(metal_1);
    }
    if (((x_btm_right - end_x) > ss_width) &&
        ((x_top_right - end_x) > (2.001 * sec_min_short_hori_edge))) {
        var x_mid_2 = x_top_right - sec_min_short_hori_edge;
        metal_3.push(end_x, y1, end_x, y2, x_mid_2, y2, x_mid_2, y1);
        metal_4.push(x_mid_2, y1, x_mid_2, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3, metal_4);
        console.log(" METAL RECT end_x  " + end_x);
        console.log("LAST METAL: x_mid " + x_mid_2);
        console.log("LAT METAL: x_top_right +" + x_top_right);
    }
    else {
        metal_3.push(end_x, y1, end_x, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3);
    }
    ms_corners.push(metals);
}

function ms_placement_invert(start_x, end_x, x_btm_left, x_top_left, x_btm_right, x_top_right, y1, y2) {
    var metal_1 = [];
    var metal_2 = [];
    var metal_3 = [];
    var metal_4 = [];
    var metals = [];
    if (((start_x - x_top_left) > ss_width) &&
        ((start_x - x_btm_left) > 2.001 * sec_min_short_hori_edge)) {
        var x_mid = x_btm_left + sec_min_short_hori_edge;
        metal_1.push(x_btm_left, y1, x_top_left, y2, x_mid, y2, x_mid, y1);
        metal_2.push(x_mid, y1, x_mid, y2, start_x, y2, start_x, y1);
        metals.push(metal_1, metal_2);
    }
    else {
        metal_1.push(x_btm_left, y1, x_top_left, y2, start_x, y2, start_x, y1);
        metals.push(metal_1);
    }
    if (((x_top_right - end_x) > ss_width) &&
        ((x_btm_right - end_x) > (2.001 * sec_min_short_hori_edge))) {
        var x_mid_2 = x_btm_right - sec_min_short_hori_edge;
        metal_3.push(end_x, y1, end_x, y2, x_mid_2, y2, x_mid_2, y1);
        metal_4.push(x_mid_2, y1, x_mid_2, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3, metal_4);
        console.log(" METAL RECT end_x  " + end_x);
        console.log("LAST METAL: x_mid " + x_mid_2);
        console.log("LAT METAL: x_top_right +" + x_top_right);
    }
    else {
        metal_3.push(end_x, y1, end_x, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3);
    }
    ms_corners.push(metals);
}

function mix_ms_placement(end_x, x_btm_right, x_top_right, y1, y2) {
    //maybe put 2 metal shingles. 
    var metal_3 = [];
    var metal_4 = [];
   
    var metals = [];
    if (((x_btm_right - end_x) > ss_width) &&
        ((x_top_right - end_x) > (2.001 * sec_min_short_hori_edge))) {
        var x_mid_2 = x_top_right - sec_min_short_hori_edge;
        metal_3.push(end_x, y1, end_x, y2, x_mid_2, y2, x_mid_2, y1);
        metal_4.push(x_mid_2, y1, x_mid_2, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3, metal_4);
        console.log(" METAL RECT end_x  " + end_x);
        console.log("LAST METAL: x_mid " + x_mid_2);
        console.log("LAT METAL: x_top_right +" + x_top_right);
    }
    else {
        metal_3.push(end_x, y1, end_x, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3);
    }
    ms_corners.push(metals);

}

function mix_ms_placement_invert(end_x, x_btm_right, x_top_right, y1, y2) {
    var metal_3 = [];
    var metal_4 = [];
    var metals = [];
    if (((x_top_right - end_x) > ss_width) &&
        ((x_btm_right - end_x) > (2.001 * sec_min_short_hori_edge))) {
        var x_mid_2 = x_btm_right - sec_min_short_hori_edge;
        metal_3.push(end_x, y1, end_x, y2, x_mid_2, y2, x_mid_2, y1);
        metal_4.push(x_mid_2, y1, x_mid_2, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3, metal_4);
        console.log(" METAL RECT end_x  " + end_x);
        console.log("LAST METAL: x_mid " + x_mid_2);
        console.log("LAT METAL: x_top_right +" + x_top_right);
    }
    else {
        metal_3.push(end_x, y1, end_x, y2, x_top_right, y2, x_btm_right, y1);
        metals.push(metal_3);
    }
    ms_corners.push(metals);
}


/// For dropped eave shape.
/// The left edge is longer than right edge.
/// eave is shorter than ridge
function dropped_eave_placement(roof) {
    if ((g_symmetric) || (g_rectangle)) {
        console.log("Calling the wrong function..., exit");
        return;
    }
    // If we already flip the image, the left offset < right offset. 
    // Process rows: 
    start_y = cv_invert_start_y;
    //var sec_cv_total_rows = find_total_rows(cv_real_height, start_y, sec_ridge_ss_offset);
    console.log("total rows" + cv_total_rows);
    for (let row = 0; row < cv_total_rows; row++) {
        var y1 = (start_y + row * ss_height); // use this y1.
        var y2 = (start_y + row * ss_height + ss_height);
        if (row < g_dropped_eave_lower_part_rows) {
            let [x_btm_right, x_top_right] = get_right_coord(roof, y1, y2);
            var x_btm_left = cv_left_gap_x;
            var x_top_left = cv_left_gap_x;
            var usable_width = x_btm_right - x_btm_left;
            var ss_per_row = Math.floor(usable_width / ss_width);
            var start_x = x_btm_left;
            var ss_length = ss_per_row * ss_width;
            get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
            console.log("row " + row);
            var tmp = start_x + ss_length;
            console.log("x_btm_right  " + x_btm_right + " end of SS is  " + tmp);
        }
        else {
            var x_btm_left = cv_left_gap_x;

            var x_btm_right = roof.ridge - left_right_ss_offset;// cv_right_gap_x; 
            var usable_width = x_btm_right - x_btm_left;
            var ss_per_row = Math.floor(usable_width / ss_width);
            var start_x = x_btm_left;
            var ss_length = ss_per_row * ss_width;
            get_ss_per_row(ss_per_row, ss_width, start_x, y1, y2);
            console.log("long row " + row);
            var tmp = start_x + ss_length;
            console.log("x_btm_right  " + x_btm_right + " end of SS is  " + tmp);
        }
       
        if (row == (cv_total_rows - 1)) {
            cv_max_ss_in_row = ss_per_row;
        }     
    }
    if (g_flipped) {
        flip_left_right(roof);
    }
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
        if (g_dropped_eave) {
            for (let i = 0; i < 6; i++) {
                drawLine(ctx, [six_corners[i][0], y_upper - six_corners[i][1]], [six_corners[(i + 1) % 6][0], y_upper - six_corners[(i + 1) % 6][1]], 'green', 3);

            }
        }
        //if (!g_max_fit) {
        //    drawLine(ctx, [cv_ref_line_x, drawing_offset], [cv_ref_line_x, cv_real_height + drawing_offset], 'red', 2);
        //}
       
        //drawLine(ctx, [cv_invert_mid_x, drawing_offset], [cv_invert_mid_x, cv_real_height + drawing_offset], 'green', 2);
        
        //drawLine(ctx, [cv_invert_mid_x - ss_width/2, drawing_offset], [cv_invert_mid_x-ss_width/2, cv_real_height + drawing_offset], 'yellow', 2);
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
        g_odd_shape_left = true;
    }
    else {
        g_odd_shape_left = false; 
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
    if (sum >= roof.ridge) {
        alert("Enter correct value for eave and dropped eave . Sum of them should be less than right!");
        var tmp_eave = roof.ridge - roof.eave;
        if (tmp_eave <= 0) {
            tmp_eave = 5;
        }
        document.getElementById("dropped_eave").value = Number(tmp_eave);
        var tmp = roof.ridge - tmp_eave - 5;
        if (tmp <= 0) {
            tmp = 5;
        }
        document.getElementById("eave").value = Number(tmp);

         
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
