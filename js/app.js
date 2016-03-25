'use strict';

var app = angular.module('app', []);

app.directive("changecolor", ["$timeout", function($timeout){
  return {
    restrict: "A",
    link: function(scope, element, attr){
        element = $(element);
        console.log(element);
        var dr = 1, rs = 1,
            dg = 2, gs = 1,
            db = 3, bs =1;
        var r = 0, g = 0, b = 0;

        function change(){
            if(r < 0 || r>255) rs *= -1;
            if(g < 0 || g>255) gs *= -1;
            if(b < 0 || b>255) bs *= -1;            
            r = (r+dr*rs);
            g = (g+dg*gs);
            b = (b+db*bs);
            element.css({ background: "rgba("+r+","+g+","+b+", 1)"});
        }
        function start(){
            change();
            $timeout(start, 40);
        }
        start();
    }
  };
}]);

app.directive("drawing", function($timeout){
  return {
    restrict: "A",
    link: function(scope, element, attr){
        var ctx = element[0].getContext('2d');

        ctx.width = attr["width"];
        ctx.height = attr["height"];

        ctx.transform(1, 0, 0, -1, ctx.width / 2, ctx.height / 2);
        scope.animateTree(ctx);
    }
  };
});


app.controller("mainController", ["$scope", "$timeout", function($scope, $timeout){
    $scope.templates = {
        bush: 'Куст',
    };
    $scope.axiom='F';
    $scope.rule = '-F+F+[+F-F-]-[-F+F+F]';
    $scope.n = 5;
    $scope.q = 3;
    $scope.s = 20;

    $scope.drawTemplate = function(){
        if($scope.template == 'bush')
            drawBush();
    }

    function drawBush(){
        $scope.axiom='F';
        $scope.rule = '-F+F+[+F-F-]-[-F+F+F]';
        $scope.n = 5;
        $scope.q = 3;
        $scope.draw();
    }

    $scope.animateTree = function(ctx){
        $scope.n = 6;
        $scope.axiom='F';
        $scope.rule = 'F[+F][-F]';

        var dq = Math.PI / 1000;
        var sign = -1;
        var Q = 0;

        function tween(){
            if(Q < -16*Math.PI || Q > 16*Math.PI)
                sign *= -1;
            Q += dq * sign;
            $scope.q = Q;
            $scope.draw(ctx, Q/4);
        }

        function animate(){
            tween();
            $timeout(animate, 5);
        }
        animate();
    }

    $scope.draw = function(context, q0){
        var a = $scope;
        var ctx = this.ctx = context || this.ctx;
        var points = turtlePaint(a.axiom, a.rule, a.n, Math.PI * a.q / 24, q0, a.s );

        ctx.clearRect(-ctx.width/2, -ctx.height/2, ctx.width, ctx.height);
        ctx.save();
        scaling(points);
        draw(points);
        ctx.restore();

        function scaling(points){
            var left_bottom = new Point(0, 0),
                right_top = new Point(0, 0);
            for(var i = 0; i < points.length; i++){
                var p = points[i];
                if(typeof(p) != "string"){
                    if(p.x < left_bottom.x)
                        left_bottom.x = p.x;
                    if(p.x > right_top.x)
                        right_top.x = p.x;
                    if(p.y < left_bottom.y)
                        left_bottom.y = p.y;
                    if(p.y > right_top.y)
                        right_top.y = p.y;
                }
            }

            var bound = left_bottom.vectorTo(right_top);
            var sx = 800.0 / bound.x;
            var sy = 400.0 / bound.y;

            var scale = sx < sy ? sx : sy;
            var shift = bound.multy(0.5).plus(left_bottom).multy(scale);

            ctx.lineWidth = 1.0 / scale;
            ctx.transform(scale, 0, 0, scale, 0 , -100);
        }

        function draw(points){
            var states = [];
            ctx.beginPath();
            
            for(var i = 0; i < points.length; i++)
                if(points[i] === 'save'){
                    states.push(points[i-1]);
                } else if(points[i] === 'restore'){
                    var p = states.pop();
                    points[i] = p;
                    ctx.moveTo(p.x, p.y);
                } else{
                    ctx.lineTo(points[i].x, points[i].y);
                }

            ctx.stroke();    
        }
    }
}]);


function turtlePaint(axiom, rule, n, q, q0, s)
{
    var states = [];
    var curP = new Point(0, 0);
    var curQ = Math.PI / 2 + q0;
    var points = [curP.clone()];
    
    iterations(n, axiom);
    return points;

    function iterations(n, axiom){
        for(var i = 0; i < axiom.length; i++){
            var c = axiom[i];

            if(c == '+') curQ += q;
            if(c == '-') curQ -= q;
            
            if(c == '['){
                states.push({p: curP.clone(), q: curQ});
                points.push('save');
            } else if(c == ']'){
                var state = states.pop();
                curP = state.p;
                curQ = state.q;
                points.push('restore');
            }
            
            if(c == 'F' && n == 0){
                curP = curP.plus( new Point(s*Math.cos(curQ), s*Math.sin(curQ)) );
                points.push(curP.clone());
            } else if(c == 'F')
                iterations(n - 1, rule);
        }
    }
}


(function (window){
    function Point(x, y){
        this.x = x || 0;
        this.y = y || 0;
    }

    Point.prototype.clone = function(){
        return new Point(this.x, this.y);
    }

    Point.prototype.length = function() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    };

    Point.prototype.norm = function() {
        return new Point( this.x / this.length(),
                          this.y / this.length() );
    };

    Point.prototype.vectorTo = function(to) {
        var from = this;
        return new Point( to.x - from.x, 
                          to.y - from.y);
    };

    Point.prototype.orthoL = function() {
        return new Point(-this.y, this.x);
    };

    Point.prototype.orthoR = function() {
        return new Point(this.y, -this.x);
    };

    Point.prototype.plus = function(b) {
        var a = this;
        return new Point(a.x + b.x, a.y + b.y);
    };

    Point.prototype.multy = function(c) {
        return new Point(this.x * c, this.y * c);
    };

    window.Point = Point;
})(window);