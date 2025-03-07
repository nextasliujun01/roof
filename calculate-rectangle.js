/// Copyright(C) 2023 - 2033 Solarshingle Canada - All Rights Reserved
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
const sec_min_short_hori_edge = 6;// min horizontal edge length.
const sec_ms_fix_width = 27.7953; // 706mm
  

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


/// computed values
var cv_real_height = 1;
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
// Define array of 4 corners. Need to update values in array. 
var four_corners = [[0, 1], [2, 3], [4, 5], [6, 7]]; // left-bottom, left-top, right-top, right-bottom. 

var four_ss_corners = [];
var four_ms_corners = []; // for metal s

/// for testing purpose if HTML page is not available.
const roof = {
    eave: 280,
    ridge: 380,
    //left_side: 290,
    //right_side: 220,
    left_offset: 111, // left_offset + right_offset = ridge-eave (or eave-ridge)
    right_offset: 0,
    height_measured: 220,
    height_measured_roof:220,
    angle: 30, // deg between horizontal line and roof surface.
    style: 0  // 0--blend, 1--section 1, 2--section 2
}


/// For testing (Try it) button
function test() {
    if (g_data_is_valid == false) {
        alert("Data is not valid.. stop");
        return;
    }
    if (roof.height_measured == 0) {
        roof.angle = 0;
    }
    set_g_variable();
    //console.log("start...... ");
 
    if (four_ss_corners.length > 0) {
        four_ss_corners.length = 0;
        console.log("four_ss_corners : " + four_ss_corners.length);
    }
    if (four_ms_corners.length > 0) {
        four_ms_corners.length = 0;
    }
   
    var symm = false;
    symm = check_symmetric(roof);
    console.log("Symmetric check:  " + symm);
    g_symmetric = symm;
    var rect = check_rectangle(roof);
    console.log("Rectangle " + rect);
    
    g_rectangle = rect;

    display_inputs(roof);
    cv_real_height = find_real_height(roof.angle, roof.height_measured, roof.height_measured_roof);
    console.log("real height " + cv_real_height); 
    var total_rows = find_total_rows(cv_real_height, eave_ss_offset, ridge_ss_offset);
    console.log("Total rows  " + total_rows);
    cv_total_rows = total_rows; 

    find_real_side_length(cv_real_height, roof);
    console.log("Real left side length ", cv_real_left_side);
    console.log("Real right side length ", cv_real_right_side);
  
    // coordinates are from flipped if any. 
    find_corner_coord(roof, cv_real_height);
    console.log("Coordinates " + four_corners);
    console.log("normal or invert shape " + g_normal_trapezoidal);
     

    if (g_rectangle) {
        if (roof.style == 0) {
            find_rect_ss(roof);
            find_linear_inch();
        }
        else if (roof.style == 1) {
            var total_ss = find_section_style_ss_fixed_width(roof);
            find_linear_inch();
        }
        else {
            find_section_style_ss_and_ms_alt(roof);
            find_linear_inch();
        }

    }
    else {
        alert("ERROR Parameter are incorrect! ");
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
        document.getElementById('perimeter').value = Math.ceil((2 * cv_real_height + 2 * roof.eave) / 12.0);
        document.getElementById('num_ms').value = four_ms_corners.length / 8;
    }
}


//////// Find Number of SS in each row
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
                var right = (left+ ss_width);
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

/// Add new function to calculate section style, with metal shingles (2 different types)
/// Calculate the number of ss and ms for rectangle. 
function rect_calc_num_of_ss_and_ms(roof, roof_width, ss_per_row_est) {
    console.log("ss per row " + ss_per_row_est);
    var ss_per_row = 0; 
    var ms_num = 0; 
    var right_ms_width = 0; 
    var ms_width = roof_width - 2 * sec_left_right_ss_offset - ss_per_row_est * ss_width;
    if (ms_width < sec_min_short_hori_edge) {
        ss_per_row = ss_per_row_est - 1;
        
        ms_num = 2; 
        ms_width = roof_width - 2 * sec_left_right_ss_offset - ss_per_row * ss_width;
        right_ms_width = ms_width - sec_ms_fix_width; 
    }
    else {
        ss_per_row = ss_per_row_est;
        ms_num = 1;
        right_ms_width = ms_width; 
    }

    return [ss_per_row, ms_num, right_ms_width];
}
/// This function implements the idea given on 2024-05-18.
/// Two situations will be handled:
/// If the remaining width for metal shingle is less than 6", remove one SS, and put a fixed width of 706mm metal piece (rectangle) first.
/// then put another metal shingle to cover the rest. 
function find_section_style_ss_fixed_width(roof) {
    // always start from eave side:
    if (g_rectangle) {
        // redo total_rows
        var sec_cv_total_rows = find_total_rows(cv_real_height, sec_eave_ss_offset, sec_ridge_ss_offset)
        console.log("rectangle... ")
        console.log("total rows " + sec_cv_total_rows);
        //var ss_per_row = 0;
        var ss_per_row_est = Math.floor((roof.eave - 2 * sec_left_right_ss_offset) / ss_width);
        console.log("ss per row " + ss_per_row_est);
        // ms_num is the number of ms, right_ms_width is the width of ms. 
        // If ms_num == 2, right_ms_width is for the most right one, since another has fixed width
        let [ss_per_row, ms_num, right_ms_width] = rect_calc_num_of_ss_and_ms(roof, roof.eave, ss_per_row_est);
        cv_max_ss_in_row = ss_per_row;

        // total ss length
        //var ss_length = ss_per_row * ss_width;
        //var ms_length = roof.eave - ss_length - 2.0 * sec_left_right_ss_offset;
        // style-2 is simple. Just fill right side with metal for each row.
        if (roof.style > 0) {
            var start_x = 0;
            if (ms_num == 1) {
                start_x = sec_left_right_ss_offset; // start from left (0.5 inch)
            }
            else if (ms_num == 2) {
                start_x = sec_left_right_ss_offset + sec_ms_fix_width;
            }
            // var start_x = sec_left_right_ss_offset; // start from left (0.5 inch)
            console.log("start x " + start_x);
            var start_y = sec_eave_ss_offset;
            for (let row = 0; row < sec_cv_total_rows; row++) {
                var y1 = (start_y + row * ss_height);
                var y2 = (y1 + ss_height);

                var last_right = 0
                for (let col = 0; col < ss_per_row; col++) {
                    var left = (col * ss_width + start_x);
                    console.log("Left " + left);
                    var right = (left + ss_width);
                    console.log("right " + right);
                    four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
                    last_right = right;
                    
                }
                // ONLY consider 2 cases for metal shingles:
                if (ms_num == 1) {
                    four_ms_corners.push(last_right, y1, last_right, y2, (last_right + right_ms_width), y2, (last_right + right_ms_width), y1);
                }
                else if (ms_num == 2) {

                    four_ms_corners.push(sec_left_right_ss_offset, y1, sec_left_right_ss_offset, y2,
                        (sec_left_right_ss_offset + sec_ms_fix_width), y2, (sec_left_right_ss_offset + sec_ms_fix_width), y1);
                    var end_x = roof.eave - sec_left_right_ss_offset; 
                    console.log("End X" + end_x);
                    var t = last_right + right_ms_width;
                    console.log("last_right plus right_ms_width" + t);
                    four_ms_corners.push(last_right, y1, last_right, y2, end_x, y2, end_x, y1);
                }
                console.log("Current coodinate " + four_ss_corners.length);
            }
            return sec_cv_total_rows;
        }
        else {
            console.log("ERROR ! Should not use this option to put SS. ")
        }
    }
}


/// This function impletments the ideas given on 2024-08-24
/// Put the metal shingles on different side on rows alternatively.
/// If the remaining width for metal shingle is less than 6", remove one SS,
/// and put a fixed width of 706mm metal piece(rectangle) first.
/// then put another metal shingle to cover the rest.
/// Also, the first row (from eave) has its metal shingle on the right end.
/// 
function find_section_style_ss_and_ms_alt(roof) {
    // always start from eave side:
    if (g_rectangle) {
        // redo total_rows
        var sec_cv_total_rows = find_total_rows(cv_real_height, sec_eave_ss_offset, sec_ridge_ss_offset)
        console.log("rectangle... ")
        console.log("total rows " + sec_cv_total_rows);
        //var ss_per_row = 0;
        var ss_per_row_est = Math.floor((roof.eave - 2 * sec_left_right_ss_offset) / ss_width);
        console.log("ss per row " + ss_per_row_est);
        // ms_num is the number of ms, right_ms_width is the width of ms.
        // If ms_num == 2, right_ms_width is for the most right one, since another has fixed width
        // NOTE: right_ms_width is for the right most shingle on the row. 
        // But it can be used for on the left end of the row. 
        let [ss_per_row, ms_num, right_ms_width] = rect_calc_num_of_ss_and_ms(roof, roof.eave, ss_per_row_est);
        cv_max_ss_in_row = ss_per_row;

        // total ss length
        //var ss_length = ss_per_row * ss_width;
        //var ms_length = roof.eave - ss_length - 2.0 * sec_left_right_ss_offset;
        // style-2 is simple. Just fill right side with metal for each row.
        if (roof.style > 0) {
            let  start_x = 0;
            let  start_x_alt = 0; 
            if (ms_num == 1) {
                start_x = sec_left_right_ss_offset; // start from left (0.5 inch)
                start_x_alt = sec_left_right_ss_offset + right_ms_width;
            }
            else if (ms_num == 2) {
                start_x = sec_left_right_ss_offset + sec_ms_fix_width;
                start_x_alt = sec_left_right_ss_offset + right_ms_width;
            }
            // let  start_x = sec_left_right_ss_offset; // start from left (0.5 inch)
            console.log("start x " + start_x);
            let  start_y = sec_eave_ss_offset;
            for (let row = 0; row < sec_cv_total_rows; row++) {
                let  y1 = (start_y + row * ss_height);
                let  y2 = (y1 + ss_height);

                let  last_right = 0
                if (row % 2 == 0) { // first row use start_x. 
                    for (let col = 0; col < ss_per_row; col++) {
                        let  left = (col * ss_width + start_x);
                        console.log("Left " + left);
                        let  right = (left + ss_width);
                        console.log("right " + right);
                        four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
                        last_right = right;
                    }
                    // ONLY consider 2 cases for metal shingles:
                    if (ms_num == 1) {
                        four_ms_corners.push(last_right, y1, last_right, y2, (last_right + right_ms_width), y2, (last_right + right_ms_width), y1);
                    }
                    else if (ms_num == 2) {
                        four_ms_corners.push(sec_left_right_ss_offset, y1, sec_left_right_ss_offset, y2,
                            (sec_left_right_ss_offset + sec_ms_fix_width), y2, (sec_left_right_ss_offset + sec_ms_fix_width), y1);
                        let  end_x = roof.eave - sec_left_right_ss_offset;
                        console.log("End X" + end_x);
                        let  t = last_right + right_ms_width;
                        console.log("last_right plus right_ms_width" + t);
                        four_ms_corners.push(last_right, y1, last_right, y2, end_x, y2, end_x, y1);
                    }
                }
                else {
                    for (let col = 0; col < ss_per_row; col++) {
                        let  left = (col * ss_width + start_x_alt);
                        console.log("Left " + left);
                        let  right = (left + ss_width);
                        console.log("right " + right);
                        four_ss_corners.push(left, y1, left, y2, right, y2, right, y1);
                        last_right = right;
                    }
                    // ONLY consider 2 cases for metal shingles:
                    if (ms_num == 1) { // metal is on the left end.... 
                        four_ms_corners.push(sec_left_right_ss_offset, y1, sec_left_right_ss_offset, y2, start_x_alt, y2, start_x_alt , y1);
                    }
                    else if (ms_num == 2) {
                        four_ms_corners.push(sec_left_right_ss_offset, y1, sec_left_right_ss_offset, y2, start_x_alt, y2, start_x_alt , y1);
                        let  end_x = roof.eave - sec_left_right_ss_offset;
                        console.log("End X" + end_x);
                        let  t = last_right + right_ms_width;
                        console.log("last_right plus right_ms_width" + t);
                        four_ms_corners.push(last_right, y1, last_right, y2, end_x, y2, end_x, y1);
                    }

                }
                console.log("Current coodinate " + four_ss_corners.length);
            }
            return sec_cv_total_rows;
        }
        else {
            console.log("ERROR ! Should not use this option to put SS. ")
        }
    }
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

  
///TODO: merge these two functions
/// Use height (distance between eave and ridge)
function find_total_rows(actual_height, bottom_offset, top_offset) { 
    var total_height = (actual_height - bottom_offset - top_offset) / ss_height;
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
            drawLine(ctx, [four_corners[i][0], y_upper - four_corners[i][1]], [four_corners[(i + 1) % 4][0], y_upper - four_corners[(i+1)%4][1]], 'green', 2);
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
        if (roof.style > 0) { 
            var total_ms = four_ms_corners.length / 8; 
            for (let i = 0; i < total_ms; i = i + 1) {
                drawLine(ctx, [four_ms_corners[i * 8], y_upper - four_ms_corners[i * 8 + 1]], [four_ms_corners[i * 8 + 2], y_upper - four_ms_corners[i * 8 + 3]], 'blue', 2);
                drawLine(ctx, [four_ms_corners[i * 8 + 2], y_upper - four_ms_corners[i * 8 + 3]], [four_ms_corners[i * 8 + 4], y_upper - four_ms_corners[i * 8 + 5]], 'blue', 2);
                drawLine(ctx, [four_ms_corners[i * 8 + 4], y_upper - four_ms_corners[i * 8 + 5]], [four_ms_corners[i * 8 + 6], y_upper - four_ms_corners[i * 8 + 7]], 'blue', 2);
                drawLine(ctx, [four_ms_corners[i * 8 + 6], y_upper - four_ms_corners[i * 8 + 7]], [four_ms_corners[i * 8], y_upper - four_ms_corners[i * 8 + 1]], 'blue', 2);
            }
           
            var h = ss_height - 2;
            for (let i = 0; i < total_ms; i = i + 1) {
                var x = four_ms_corners[i * 8 + 2]+1;
                var y = y_upper - four_ms_corners[i * 8 + 3] + 1;
                var w = Math.abs(four_ms_corners[i * 8] - four_ms_corners[i*8+4]) - 2;
                ctx.fillStyle = 'gray';
                ctx.fillRect(x, y, w, h);
                console.log("x start = " + four_ms_corners[i * 8 + 2]);
                console.log("x end = " + four_ms_corners[i * 8 + 4]);
                console.log("y = " + four_ms_corners[i * 8 + 3]);
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
        var ridge = eave;// document.getElementById('ridge').value;


        var left_offset = 0;// document.getElementById('left_offset').value;
        var right_offset = 0;//document.getElementById('right_offset').value;
        var height_measured = document.getElementById('height_measured').value;
        var height_measured_real = document.getElementById('height_measured_real').value;
        var pitch_rise = document.getElementById('pitch_rise').value;
        console.log("read data as " + eave + "   " + ridge);
        //console.log("read data as " + left_side + "   " + right_side);
        console.log("left_offset : " + left_offset + " right_offset: " + right_offset);
        console.log("height measured " + height_measured + " pitch_rise:  " + pitch_rise);
        console.log("Height_measured real !! " + height_measured_real);
        if (check_input(eave) == false) {
            return;
        }
        if (check_input(ridge) == false) {
            return;
        }

        //if (check_input(left_offset) == false) {
        //    return;
        //}
        //if (check_input(right_offset) == false) {
        //    return;
        //}
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
        roof.left_offset = 0;//Number(left_offset);
        roof.right_offset = 0;//Number(right_offset);
        roof.height_measured = Number(height_measured);
        roof.height_measured_roof = Number(height_measured_real);

        if ((roof.height_measured == 0) && (roof.height_measured_real == 0)) {
            console.log("Error: Height of Roof is 0 ");
            alert("You need to enter the value for the height of the roof...! ");
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
        //if ((status_left_offset == false) && (status_right_offset == false) ) {
        //    alert("You need to enter at least one of left_offset or right_offset...! ");

        //}
        read_data_status.left_offset = status_left_offset;
        read_data_status.right_offset = status_right_offset;

        //var rect_style = document.getElementById("rect_style");
        
        var style_selected = document.querySelector('input[name="rect_style"]:checked').value;
        roof.style = Number(style_selected);
        
        console.log(roof.style);

    }
///
function validate_and_update_data() {
    if (Math.abs(roof.eave - roof.ridge) < 1) {
        if ((read_data_status.left_offset == false) || (read_data_status.right_offset == false)) {
            let value = prompt("For rectangle, set offsets to 0", 0);
            document.getElementById("left_offset").value = Number(value);
            document.getElementById("right_offset").value = Number(value);
        }
        return;
    }

    var sum = roof.left_offset + roof.right_offset;
    var diff = 0;
    if (roof.eave > roof.ridge) {
        diff = roof.eave - roof.ridge;
    }
    else if (roof.eave < roof.ridge) {
        diff = roof.ridge - roof.eave;
        normal_shape = false;
    }
    var diff_offset = diff - sum;
    if (diff_offset < 0) {
        alert("Enter correct left and right offset. Sum of offsets is too large! Set to 0!");
        document.getElementById("left_offset").value = Number(0);
        document.getElementById("right_offset").value = Number(0);
        roof.left_offset = Number(0);
        roof.right_offset = Number(0);
        return;
    }
    if (Math.abs(diff_offset) > 1) {
        console.log("In validate (), " + read_data_status.left_offset + " ,  " + read_data_status.right_offset); 
        if (read_data_status.left_offset) {
            var temp = diff - roof.left_offset;
            let value = prompt("To ensure left and right offset are correct, enter right offset value ", temp);
            if (value == null || value == "") {
                text = "User cancelled the prompt";
            }
            else {
                text = "User enter value";
                document.getElementById("right_offset").value = Number(value);
                // update right_offset value!!!
                roof.right_offset = Number(value);
            }
        }
        else if (read_data_status.right_offset) { // right offset is set.
            var temp = diff - roof.right_offset;
            let value = prompt("To ensure left and right offset are correct, enter left offset value ", temp);
            if (value == null || value == "") {
                text = "User cancelled the prompt";
            }
            else {
                text = "User enter value";
                document.getElementById("left_offset").value = Number(value);
                // update left_offset value!!!
                roof.left_offset = Number(value);
            }
        }
        else {
            console.log("validate_and_udapte_data() both offsets are not set ");
            var temp = diff;
            let value = prompt("Program set left offset value as ", temp);
            if (value == null || value == "") {
                text = "User cancelled the prompt";
            }
            else {
                text = "User enter value";
                document.getElementById("left_offset").value = Number(value);
                document.getElementById("right_offset").value = Number(0);
                
                // update right_offset value!!!
                roof.left_offset = Number(value);
                roof.right_offset = Number(0);
            }

        }
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
            //validate_and_update_data();
            v = validate_roof_data_only();
        }

        g_data_is_valid = v;
        read_data_status.left_offset = true;
        read_data_status.right_offset = true;

        console.log("roof info update:   ");
        console.log("read data as " + roof.eave + "   " + roof.ridge);
        // console.log("read data as " + roof.left_side + "   " +  roof.right_side);
        console.log("left_offset : " + roof.left_offset + " right_offset: " + roof.right_offset);
        console.log("height measured " + roof.height_measured + " angle:  " + roof.angle);
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
