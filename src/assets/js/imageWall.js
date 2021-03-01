// 音频视频图片的拓展插件

(() => {
	const chChangeLoadingHint = new BroadcastChannel('change-loading-hint');

	const queryAll = (tag, host) => {
		host = host || document;
		var eles = host.querySelectorAll(tag);
		return [].map.call(eles, e => e);
	};
	const createEle = (tag, cls) => {
		var ele = document.createElement(tag);
		if (String.is(cls)) ele.classList.add(cls);
		else if (Array.is(cls)) cls.forEach(c => ele.classList.add(c));
		return ele;
	};
	const stopOthers = (ele, all) => {
		all.forEach(e => {
			if (e === ele) return;
			e.pause();
		});
	};

	global.ImageWall = {
		whRate: 3 / 4,
		async init () {
			const Container = document.querySelector('#container > div');

			// 多媒体文件播放时自动暂停其它多媒体文件
			var avs = [...queryAll('.markup-content audio'), ...queryAll('.markup-content video')];
			avs.forEach(a => {
				a.onplay = () => stopOthers(a, avs);
			});

			var imageCount = 0, imageLoaded = 0;
			queryAll('.markup-content .image-wall').forEach(w => {
				var divs = queryAll('div.resource', w);

				w._total = divs.length;
				w._index = 0;
				w._frame = w.querySelector('div.image-container.image-ghost');
				if (!w._frame) {
					w._frame = createEle('div', ['image-container', 'image-ghost']);
					w.appendChild(w._frame);
				}
				w._float = w.querySelector('div.image-container.image-float');
				if (!w._float) {
					w._float = createEle('div', ['image-container', 'image-float']);
					w.appendChild(w._float);
				}
				w._left = w.querySelector('div.image-button-left');
				if (!w._left) {
					w._left = createEle('div', 'image-button-left');
					w._left.innerHTML = '<i class="fas fa-angle-left"></i>';
					w.appendChild(w._left);
					w._left.addEventListener('click', evt => {
						if (w._index <= 0) return;
						w._index --;
						w._float.style.transform = 'translateX(-' + (100 / w._total * w._index) + '%)';
						if (w._index < w._total - 1) w._right.classList.remove('inactive');
						if (w._index <= 0) w._left.classList.add('inactive');
					});
				}
				w._right = w.querySelector('div.image-button-right');
				if (!w._right) {
					w._right = createEle('div', 'image-button-right');
					w._right.innerHTML = '<i class="fas fa-angle-right"></i>';
					w.appendChild(w._right);
					w._right.addEventListener('click', evt => {
						if (w._index >= w._total - 1) return;
						w._index ++;
						w._float.style.transform = 'translateX(-' + (100 / w._total * w._index) + '%)';
						if (w._index > 0) w._left.classList.remove('inactive');
						if (w._index >= w._total - 1) w._right.classList.add('inactive');
					});
				}

				w._callback = (width, height) => {
					if (divs.some(d => !d._ready)) return;
					w.classList.add('loaded');
					w._index = 0;
					w._float.style.transform = 'translateX(0%)';
					w._left.classList.add('inactive');

					divs.forEach((div, i) => {
						var frame = createEle('div', 'image-frame');
						w._frame.appendChild(frame);
						frame.appendChild(div);
					});

					w._float.innerHTML = w._frame.innerHTML;
					w._float.style.width = (w._total * 100) + '%'
					queryAll('div.image-frame', w._float).forEach(div => {
						div.style.width = (100 / w._total) + '%';
					});
				};
				divs.map(div => {
					w._frame.appendChild(div);
					div._wall = w;
					div.classList.add('inside');
				});
			});

			await Promise.all(queryAll('div.resource.image').map(div => new Promise(res => {
				imageCount ++;
				var img = div.querySelector('img'), fig = div.querySelector('figure');
				if (!img) {
					imageLoaded ++;
					chChangeLoadingHint.postMessage({title: '载入图片: ' + imageLoaded + ' / ' + imageCount});
					return res();
				}
				var inside = div.classList.contains('inside');
				if (!inside) div.classList.add('outside');

				img.onload = () => {
					var containerWidth = Container.getBoundingClientRect().width;
					var containerHeight = containerWidth * ImageWall.whRate;

					img._available = true;
					img.setAttribute('oWidth', img.naturalWidth);
					img.setAttribute('oHeight', img.naturalHeight);
					fig.classList.add('loaded');
					fig.style.backgroundImage = 'url(' + img.src + ')';
					div.style.width = img.naturalWidth + 'px';

					var rateWidth = img.naturalWidth;
					var rateHeight = img.naturalHeight;
					if (img.naturalHeight / img.naturalWidth > ImageWall.whRate) {
						fig.classList.add('tall');
						fig.style.width = (100 * img.naturalWidth / img.naturalHeight * ImageWall.whRate) + '%';
						fig.style.paddingTop = (100 * ImageWall.whRate) + '%';
						rateHeight = img.naturalWidth * ImageWall.whRate;
						rateWidth = rateHeight * img.naturalWidth / img.naturalHeight;
					}
					else {
						fig.classList.remove('tall');
						fig.style.width = '100%';
						fig.style.paddingTop = (100 * img.naturalHeight / img.naturalWidth) + '%';
					}

					if (!!div._wall) {
						div._ready = true;
						div._wall._callback(rateWidth, rateHeight);
					}

					imageLoaded ++;
					chChangeLoadingHint.postMessage({title: '载入图片: ' + imageLoaded + ' / ' + imageCount});
					res();
				};
				img.onerror = () => {
					img._available = false;
					div.classList.add('failed');

					imageLoaded ++;
					chChangeLoadingHint.postMessage({title: '载入图片: ' + imageLoaded + ' / ' + imageCount});
					res();
				};
			})));
		}
	};
})();