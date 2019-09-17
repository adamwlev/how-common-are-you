const D = 290;
const dens = .25;
const n = 325719178;
const n_without = 238771628;
const max_attempts = 5000;
const overall_max_attempts = 35;
const k = 6;
const n_big_ones = 1;
const pct_w_big_ones = .8;
const buffer = 1.35;

const cats = ["age_cat","race_cat","sex_cat","mar_cat",
              "edu_cat","nei_cat","income_cat","fempl_cat"];

function distance(a, b){
  return Math.pow(Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2),.5);
};

function overlaps(points,point1,buff){
  var seen = {};
  var i;
  for (i = 0; i < points.length; i++) {
    var point = points[i];
    if (seen[point[0]]){
        continue;
    }
    if (distance({x:point[0],y:point[1]},{x:point1[0],y:point1[1]})<(point[2]+point1[2]+buff)){
        return true;
    }
    seen[point[0]] = true;
  }
  return false;
};

function draw_circles(top_key,indicators,sel_tup){
    const sub = data.get(top_key).get(indicators);
    var svg = d3.select("svg");
    svg.selectAll("circle.temp-circle").remove();
    svg.selectAll("path.arrow").remove();
    var circles = [];
    var tree = new kdTree([], distance, ["x", "y"]);
    var center_to_radius = {};
    var n_w_big_ones = (1-pct_w_big_ones)*sub.get("n_populated_groups");
    const n_peeps = ((top_key=="with_z") ? n : n_without);
    var overall_attempts = 0;
    while (overall_attempts<overall_max_attempts){
        var break_out = true;
        for (const [key,value] of sub.get("vals")){
            var is_purple = key==sel_tup;
            var radius = D/2*Math.pow(dens*value[0]/n_peeps,.5);
            var attempts = 0;
            while (attempts<max_attempts){
                r = (D/2-radius) * Math.pow(Math.random(),.5);
                theta = Math.random()*2*Math.PI;
                x = r*Math.cos(theta);
                y = r*Math.sin(theta);
                search_res = tree.nearest({"x":x,"y":y}, k);
                var points_to_try = [];
                search_res.forEach(function(res){
                    points_to_try.push([res[0].x,res[0].y,center_to_radius[[res[0].x,res[0].y]]]);
                });
                if ((circles.length>n_big_ones) && (circles.length>n_w_big_ones)) {
                    points_to_try.push.apply(points_to_try, circles.slice(0,n_big_ones));
                }
                if (!overlaps(points_to_try,[x,y,radius],((sub.get("n_populated_groups") > 100) ? buffer : buffer + 4))){
                    tree.insert({"x":x,"y":y});
                    center_to_radius[[x,y]] = radius;
                    circles.push([x,y,radius]);
                    svg.append("circle")
                       .attr("class","temp-circle")
                       .attr("cx", 150+x)
                       .attr("cy", 150+y)
                       .attr("r", radius)
                       .style("fill",((is_purple) ? "#6603fc" : "#f77284"))
                       //.style("stroke", ((is_purple) ? "none" : "red"));
                    if ((is_purple) && (radius<1.5)){
                        svg.append('path')
                            .style("fill","none")
                            .attr("class","arrow")
                            .attr("marker-end","url(#triangle)")
                            .attr("stroke","black")
                            .attr("d",get_path(x,y,radius));
                    }
                    break
                }
                attempts += 1;
            }
            if ((attempts==max_attempts) && ((is_purple) || sub.get("n_populated_groups")<30)){
                break_out = false;
                svg.selectAll("circle.temp-circle").remove();
                svg.selectAll("path.arrow").remove();
                circles = [];
                center_to_radius = [];
                tree = new kdTree([], distance, ["x", "y"]);
                break
            }
        }
        if (break_out){
            break
        }
        overall_attempts += 1;
    }
    //console.log(overall_attempts);
};

function update_text_results(top_key,indicators,sel_tup){
    const sub = data.get(top_key).get(indicators);
    const n_populated_groups = sub.get("n_populated_groups");
    const n_groups = sub.get("n_groups");
    const n_unpopulated_groups = n_groups - n_populated_groups;
    if (!sub.get("vals").get(sel_tup)){
        var group_rank_str = (n_populated_groups + 1) + "th";
        var percentile = 0;
        $(".results").html("This selection has <b>" + 0 + "</b> people in it.<br>" + "Out of the " + n_groups + " theoretical groups (" + n_unpopulated_groups + " of which are unpopulated), this selection is tied for the <b>" + group_rank_str + "</b> most populated group; it's more populated than <b>" + percentile + "%</b> of the groups.");
    }
    else {
        const n_people = format_big_number(sub.get("vals").get(sel_tup)[0]);
        const group_rank = sub.get("vals").get(sel_tup)[1];
        var group_rank_str;
        switch(true){
            case (group_rank==1):
                group_rank_str = group_rank + "st";
                break;
            case (group_rank==2):
                group_rank_str = group_rank + "nd";
                break;
            case (group_rank==3):
                group_rank_str = group_rank + "rd";
                break;
            case (group_rank>3):
                group_rank_str = group_rank + "th";
                break;
        }
        const percentile = Math.round((n_populated_groups-group_rank)/n_populated_groups *100,2);
        if (n_populated_groups<n_groups){
            $(".results").html("This selection has <b>" + n_people + "</b> people in it.<br>" + "Out of the " + n_groups + " theoretical groups (" + n_unpopulated_groups + " of which are unpopulated), this selection is the <b>" + group_rank_str + "</b> most populated group; it's more populated than <b>" + percentile + "%</b> of the groups.");
        }
        else{
            $(".results").html("This selection has <b>" + n_people + "</b> people in it.<br>" + "Out of the " + n_groups + " groups, this selection is the <b>" + group_rank_str + "</b> most populated group; it's more populated than <b>" + percentile + "%</b> of the groups.");
        }
    }
};

function draw_first_circle(){
    var svg = d3.select("svg");
    svg.selectAll("circle.temp-circle").remove();
    svg.append("circle")
        .attr("class","temp-circle")
        .attr("cx", 150)
        .attr("cy", 150)
        .attr("r", 140)
        .style("fill", "#6603fc");
    $(".results").html("No selection has been made yet so the circle represents all <b>" + format_big_number((($("#include_genz").prop("checked")) ? n : n_without)) + "</b> people in the dataset.");
    if (!($("#triangle").length)){
        svg.append("svg:defs").append("svg:marker")
        .attr("id", "triangle")
        .attr("refX", 6)
        .attr("refY", 6)
        .attr("markerWidth", 12)
        .attr("markerHeight", 12)
        .attr("markerUnits","strokeWidth")
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M2,2 L10,6 L2,10 L6,6 L2,2")
        .style("fill", "black");
    }
    
};

function put_clear_listeners(){
    $('button.clear').on('click',function(){
        var changed = false;
        $("input[name="+ $(this).attr("for")+"]").each(function(){
            if ($(this).prop("checked")){
                changed = true;
            }
        });
        if (changed){
            $("input[name="+ $(this).attr("for")+"]").prop("checked",false);
            update_circles();
        }
    });
};

function put_radio_listeners(){
    $('input[type=radio]').on('change',function(){
        update_circles();
    });
};

function put_genz_listeners(){
    $('#include_genz').on('change',function(){
        if (!$(this).prop("checked")){
            $("#genz").prop("checked",false);
        }
        $("#genz").prop('disabled',!$(this).prop("checked"));
        update_circles();
    });
};

function get_path(x,y,radius){
    const slack = 6;
    var x = 150+x;
    var y = 150+y;
    var dxs = Math.pow(150-x,2);
    var dys = Math.pow(150-y,2);
    var den = Math.pow(dxs+dys,.5);
    var cx = 150 + 155*(x-150)/den;
    var cy = 150 + 155*(y-150)/den;
    var slope = (cy-y)/(cx-x);
    var xs = 1/(1+Math.abs(slope));
    var ys = 1-xs;
    if (cx>150){
        dx = (radius + slack)*xs;
    }
    else {
        dx = (-radius - slack)*xs;
    }
    if (cy>150){
        dy = (radius + slack)*ys;
    }
    else {
        dy = (-radius - slack)*ys;
    }
    var path = "M" + cx + "," + cy + " L"+(x+dx)+","+(y+dy);
    return path;
}

function format_big_number(n){
    const str_n = "" + n;
    var out_str = "";
    var i;
    for (i=0; i<str_n.length; i++){
        var chars_left = str_n.length-i-1;
        if ((chars_left>0) && (chars_left%3)==0){
            out_str += str_n[i] + ",";
        }
        else {
            out_str += str_n[i];
        }
    }
    return out_str;
};

function update_circles(){
    var indicators = '';
    var sel_tup = '';
    var i;
    for (i=0; i<cats.length; i++){
        var cat = cats[i]
        var j = 'false,';
        $("input[name=" + cat + ']').each(function(){
            if ($(this).prop("checked")){
                j = 'true,';
                sel_tup += $(this).attr("id") + ',';
            }
        });
        indicators += j;
    }
    indicators = indicators.slice(0, -1);
    sel_tup = sel_tup.slice(0, -1);
    if (sel_tup.length>0){
        draw_circles((($("#include_genz").prop("checked")) ? "with_z" : "without_z"),indicators,sel_tup);
        update_text_results((($("#include_genz").prop("checked")) ? "with_z" : "without_z"),indicators,sel_tup);
    }
    else {
        draw_first_circle();
    }
    
};

function init(){
    put_clear_listeners();
    put_radio_listeners();
    put_genz_listeners();
    update_circles();
};

window.addEventListener("load", init);

