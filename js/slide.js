;(function(){
	var /*querySelectorAll封装，返回数组*/
		$ = function(sel, holder){	
			return [].slice.call( (holder||document).querySelectorAll(sel) );
		};
	var 
		cover = $(".cover")[0],
		sections = $("#container > section"),
		holder = $("#holder"),
		current_index = 0,
		css_model = function(h,l){
			return "-webkit-transform: translate("+(l|0)+"px, "+(h|0)+"px); transform: translate("+(l|0)+"px, "+(h|0)+"px);";
		};

		/*批量事件绑定*/
	$.on = function(dom, eventType, f){
		[].concat(dom).forEach(function(d){
			eventType.split(/\W+/).forEach(function(type){
				d.addEventListener(type, f ,false);
			});
		});
		return $;
	};

	// 设置多页切换
	window.transform_set = function(dom, i){
		var H = document.documentElement.clientHeight;
		if( "undefined" === typeof i ){
			i = dom | 0;
		}else if( "number" != typeof dom ){
			i = sections.indexOf(dom) + i;
		}
		i = Math.min( Math.max( 0, i ), sections.length - 1);

		if( sections[i].classList.contains("with-cover") ){	//如果有画轴嵌入, 动画时长增加
			cover.style.cssText = css_model(0);
			setTimeout(set,500);
			setTimeout(function(){
				cover.style.cssText = css_model(0, document.documentElement.clientWidth);
			},1000);
		}else{
			setTimeout( set, 0 );
		}
		// 依次设置所有section参数
		function set(){
			if( i && current_index === i ){
				return;
			}
			sections.forEach(function(section, index){
				switch(index){
					case i: 
						current_index = i;
						section.style.cssText = css_model();
						section.setAttribute("data-pos","current");
						setTimeout(function(){
							section.style.zIndex = 1
						},0);
						break;
					case i+1: 
						section.style.cssText = css_model(H,3);
						section.setAttribute("data-pos","next");
						setTimeout(function(){
							section.style.zIndex = 3
						},0);
						break;
					case i-1: 
						section.style.cssText = css_model(-H,3);
						section.setAttribute("data-pos","prev");
						setTimeout(function(){
							section.style.zIndex = 3
						},0);
						break;
					default: 
						section.style.cssText = css_model( (index > i) ? H : -H ); 
						section.removeAttribute("data-pos");
						setTimeout(function(){
							section.style.zIndex = 1
						},0);			 
				}
			});
		}
	};

	transform_set(0);
	// resize
	$.on(window, "resize", function(){
		window.transform_set( 0 );
	});


	// 图片预加载
	all_images = [].slice.call(conf.all_images||[]);
	var step = 20, runs = [], ready = function(){
		sections.forEach(function(s, i){
			var div = document.createElement("div");
			div.style.cssText = "position:absolute;width:100%;left:0;top:0;height:" + ( Math.ceil( (s.scrollHeight - s.clientHeight) / step ) * step + s.clientHeight ) + "px;";
			s.appendChild(div);
			runs[i] = $(".run", s);
		});
		conf.ready();
	};
	var loaded = 0;
	all_images.forEach(function(img){
		var m = document.createElement( "img" );
		m.onload = m.onerror = function(){
			loaded +=1;
			if( loaded === all_images.length ){
				setTimeout(function(){
					cover.style.cssText = css_model(0, document.documentElement.clientWidth );
					ready();
				},300);
			}
		};
	});
	if( !all_images.length ){
		setTimeout(function(){
			cover.style.cssText = css_model(0, document.documentElement.clientWidth );
			ready();
		},300);
	}


	// 事件
	var startTy, curTy, endTy, autoStep;
	$.on(holder, "touchstart", function(e){
		var touch = e.touches[0];
			startTy = curTy = touch.clientY;
	}).on(holder, "touchmove", function(e){
		var touch = e.changedTouches[0],
			    endTy = touch.clientY;
		run(curTy - endTy, e);
		curTy = endTy;
	}).on(holder, "MSPointerOver", function(e){	// WP 部分机器性能对于批量设置style性能太差，改用专属的click代替
		run( e.clientY > document.documentElement.clientHeight / 2 ? step*5 : -step*10, e);
	}).on(holder, "touchend", function(e){
		if( window.navigator.msPointerEnabled ){return;}
		var touch = e.changedTouches[0],
			    endTy = touch.clientY;
		run(startTy > endTy ? 1 : -1, e);
		startTy = curTy = endTy = 0;
	}).on(holder, "keydown", function(e){
		switch(e.keyCode){
			case 32: 
			case 39:
			case 40: run( step, e ); break;
			case 37:
			case 38: run( -step, e ); break; 
		}
	}).on(holder, "mousewheel", function(e){
		run(-e.wheelDeltaY, e );
	});

	function run(dir, e){
		e.stopPropagation();
    	e.preventDefault();

		var _this = sections[current_index];
		var st = _this.scrollTop,
			ch = _this.clientHeight,
			sh = _this.scrollHeight;
		scrollTy = st;

		st = _this.scrollTop = _this.scrollTop + dir;

		if( _this.scrollTop + ch === sh && e.type !== "touchmove"){
			transform_set(_this, Math.abs(dir) / (dir||1) );
		}else{
			runs[current_index].forEach(function(r){
				if( typeof r.run === "function" ){
					r.run(_this.scrollTop == (sh-ch) ? 1 : _this.scrollTop / (sh-ch) , dir);
				}
			});
		}
	}

})();