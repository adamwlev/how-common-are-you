const D = 290;
const dens = .25;
const n = 325719178;
const max_attempts = 5000;
const k = 6;
const n_big_ones = 8;
const pct_w_big_ones = .8;
const buffer = 1.35;

const cats = ["age_cat","race_cat","sex_cat","mar_cat",
              "edu_cat","nei_cat","income_cat","fempl_cat"];

function distance(a, b){
  return Math.pow(Math.pow(a.x - b.x, 2) +  Math.pow(a.y - b.y, 2),.5);
};

function overlaps(points,point1){
  var seen = {};
  var i;
  for (i = 0; i < points.length; i++) {
    var point = points[i];
    if (seen[point[0]]){
        continue;
    }
    if (distance({x:point[0],y:point[1]},{x:point1[0],y:point1[1]})<(point[2]+point1[2]+buffer)){
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
    var circles = [];
    var tree = new kdTree([], distance, ["x", "y"]);
    var center_to_radius = {};
    var n_w_big_ones = (1-pct_w_big_ones)*sub.get("n_populated_groups");
    for (const [key,value] of sub.get("vals")){
      var radius = D/2*Math.pow(dens*value[0]/n,.5);
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
        if (!overlaps(points_to_try,[x,y,radius])){
            tree.insert({"x":x,"y":y});
            center_to_radius[[x,y]] = radius;
            circles.push([x,y,radius]);
            svg.append("circle")
               .attr("class","temp-circle")
               .attr("cx", 150+x)
               .attr("cy", 150+y)
               .attr("r", radius)
               .style("fill","none")
               .style("stroke", "red");
            break
        }
        attempts += 1;
      }
    }
};

function put_clear_listeners(){
    $('button.clear').on('click',function(){
        $("input[name="+ $(this).attr("for")+"]").prop("checked",false);
        update_circles();
    });
};

function put_radio_listeners(){
    $('input[type=radio]').on('click',function(){
        update_circles();
    });
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
    draw_circles("with_z",indicators,sel_tup)
};

function init(){
    put_clear_listeners();
    put_radio_listeners();
    var svg = d3.select("svg");
    svg.append("circle")
        .attr("class","temp-circle")
        .attr("cx", 150)
        .attr("cy", 150)
        .attr("r", 140)
        .style("fill", "#6603fc");

};

window.addEventListener("load", init);

