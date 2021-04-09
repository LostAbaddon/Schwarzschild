(() => {
	var NoteFrame, lastUI;

	const onEnter = async (evt) => {
		var ele = evt.target, cn = ele.className;
		var name = ele.getAttribute('href');
		if (!name || name.substr(0, 1) !== '#') return;
		name = name.substring(1, name.length);
		var info = lastUI.querySelector('a[name="' + name + '"]');
		if (!info) return;
		var content = info.parentElement.innerHTML.replace(info.outerHTML, '');
		var html = '';

		if (cn === 'terminology') {
			html = '<p class="note-title">' + ele.innerText + '</p>';
		}
		html += '<p class="note-content">' + content + '</p>';
		NoteFrame.innerHTML = html;
		NoteFrame._status = 1;

		var rect = ele.getBoundingClientRect();
		var isTop = true, isLeft = true;
		var left = rect.left - 10;
		var top = rect.top + rect.height + 10;
		if (left > window.innerWidth * 0.6) {
			isLeft = false;
			left = window.innerWidth - rect.right;
		}
		if (top > window.innerHeight * 0.7) {
			isTop = false;
			top = window.innerHeight - rect.top;
		}

		if (isLeft) {
			NoteFrame.style.left = left + 'px';
			NoteFrame.style.right = '';
		}
		else {
			NoteFrame.style.left = '';
			NoteFrame.style.right = left + 'px';
		}
		if (isTop) {
			NoteFrame.style.top = top + 'px';
			NoteFrame.style.bottom = '';
		}
		else {
			NoteFrame.style.top = '';
			NoteFrame.style.bottom = top + 'px';
		}
		NoteFrame.style.display = 'block';
		await wait(50);
		NoteFrame.style.opacity = '1';
		NoteFrame._status = 2;
	};
	const onLeave = async (evt) => {
		NoteFrame.style.opacity = '0';
		await wait(200);
		if (NoteFrame._status === 2) {
			NoteFrame.style.display = 'none';
			NoteFrame._status = 0;
		}
	};
	const onTransit = async (evt) => {
		var ele = evt.target, cn = ele.className;
		if (cn === 'notemark' || cn ==='terminology') {
			var css = ele.computedStyleMap();
			css = css.get('text-decoration').toString();
			var enter = false;
			if (css.indexOf('underline') >= 0) enter = true;

			if (enter) {
				var name = ele.getAttribute('href');
				if (name.substr(0, 1) !== '#') return;
				name = name.substring(1, name.length);
				var info = lastUI.querySelector('a[name="' + name + '"]');
				if (!info) return;
				var content = info.parentElement.innerHTML.replace(info.outerHTML, '');
				var html = '';

				if (cn === 'terminology') {
					html = '<p class="note-title">' + ele.innerText + '</p>';
				}
				html += '<p class="note-content">' + content + '</p>';
				NoteFrame.innerHTML = html;
				NoteFrame._status = 1;

				var rect = ele.getBoundingClientRect();
				var isTop = true, isLeft = true;
				var left = rect.left - 10;
				var top = rect.top + rect.height + 10;
				if (left > window.innerWidth * 0.6) {
					isLeft = false;
					left = window.innerWidth - rect.right;
				}
				if (top > window.innerHeight * 0.7) {
					isTop = false;
					top = window.innerHeight - rect.top;
				}

				if (isLeft) {
					NoteFrame.style.left = left + 'px';
					NoteFrame.style.right = '';
				}
				else {
					NoteFrame.style.left = '';
					NoteFrame.style.right = left + 'px';
				}
				if (isTop) {
					NoteFrame.style.top = top + 'px';
					NoteFrame.style.bottom = '';
				}
				else {
					NoteFrame.style.top = '';
					NoteFrame.style.bottom = top + 'px';
				}
				NoteFrame.style.display = 'block';
				await wait(50);
				NoteFrame.style.opacity = '1';
				NoteFrame._status = 2;
			}
			else {
				NoteFrame.style.opacity = '0';
				await wait(200);
				if (NoteFrame._status === 2) {
					NoteFrame.style.display = 'none';
					NoteFrame._status = 0;
				}
			}
		}
	};

	const initUI = (UI, query) => {
		if (!!Devices.isMobile) return;
		UI.querySelectorAll(query).forEach(ele => {
			var inited = ele.getAttribute('footnote_inited');
			if (!!inited) return;
			ele.addEventListener('mouseleave', onLeave);
			ele.addEventListener('mouseenter', onEnter);
			ele.setAttribute('footnote_inited', true)
		});
	};
	const deactiveUI = (UI, query) => {
		if (!!Devices.isMobile) return;
		UI.querySelectorAll(query).forEach(ele => {
			var inited = ele.getAttribute('footnote_inited');
			if (!inited) return;
			ele.removeEventListener('mouseleave', onLeave);
			ele.removeEventListener('mouseenter', onEnter);
			ele.removeAttribute('footnote_inited')
		});
	};

	window.InitNotes = UI => {
		NoteFrame = document.querySelector('#footnoteFrame');
		NoteFrame._status = NoteFrame._status || 0;
		if (lastUI !== UI && !!lastUI) destructe();
		lastUI = UI;

		var inited = UI.getAttribute('footnoted');
		if (!inited) {
			UI.setAttribute('footnoted', true);
			UI.addEventListener('transitionstart', onTransit);
		}

		initUI(UI, 'a.notemark');
		initUI(UI, 'a.terminology');
	};
	window.destructe = () => {
		lastUI.removeEventListener('transitionstart', onTransit);
		deactiveUI(UI, 'a.notemark');
		deactiveUI(UI, 'a.terminology');
	};

	// 表格排序
	const findTableCol = (target) => {
		var table, col, notdone = true;
		if ((target.tagName + '').match(/th/i)) {
			if (target.getAttribute('sortable') === 'true') {
				col = target;
			}
			else {
				return [null, null];
			}
		}
		else {
			col = target;
			while (notdone) {
				col = col.parentNode;
				if (!col) return [null, null];
				if ((col.tagName + '').match(/th/i)) {
					if (col.getAttribute('sortable') === 'true') {
						notdone = false;
						break;
					}
					else {
						return [null, null];
					}
				}
			}
		}
		table = col.parentNode;
		if (table.tagName.match(/table/i)) {
			return [table, col];
		}
		notdone = true;
		while (notdone) {
			table = table.parentNode;
			if (!table) return [null, null];
			if (table.tagName.match(/table/i)) {
				notdone = false;
				return [table, col];
			}
		}
		return [null, null];
	}
	document.body.addEventListener('click', (evt) => {
		var [table, col] = findTableCol(evt.target);
		if (!table || !col) return;

		var index = -1;
		[].some.call(col.parentNode.children, (ele, i) => {
			if (ele === col) {
				index = i;
				return true;
			}
		});
		if (index < 0) return;

		var dir = col.getAttribute('sortdir');
		if (dir !== 'down') dir = 'down';
		else dir = 'up';

		[].forEach.call(col.parentNode.querySelectorAll('th'), item => {
			if (item !== col) {
				item.removeAttribute('sortdir');
			}
			else {
				item.setAttribute('sortdir', dir);
			}
		});

		var rows = [].map.call(table.querySelectorAll('tbody > tr'), ele => ele);
		rows = rows.map((row, i) => {
			var td = ([].map.call(row.querySelectorAll('td'), ele => ele))[index];
			var value = td.innerText * 1;
			if (isNaN(value)) value = 0;
			return [i, value, row];
		});
		rows.sort((ra, rb) => {
			if (dir === 'up') return rb[1] - ra[1];
			else return ra[1] - rb[1];
		});
		rows.forEach(([i, value, row]) => {
			var parent = row.parentNode;
			parent.appendChild(row);
		});
	});

	// 动态图示
	var BarHeight = 25;
	var BarSpan = 5;
	var BarRightMargin = 50;
	var BarColorList = [
		'rgb(222, 28, 49)',
		'rgb(152, 54, 128)',
		'rgb(15, 89, 164)',
		'rgb(18, 161, 130)',
		'rgb(254, 215, 26)'
	];
	const animateChart = (chart) => {
		if (chart._index >= chart._limit) {
			return;
		}

		var data = chart._data[chart._index].copy();
		var hint = data.splice(0, 1)[0];
		if (!!chart._hint) {
			chart._titleHint.innerText = '(' + chart._hint + ': ' + hint + ')';
		}
		else {
			chart._titleHint.innerText = '(' + hint + ')';
		}

		var head = [], tail = [];
		data.forEach((d, i) => {
			if (Number.is(d)) head.push([i + 1, d]);
			else tail.push([i + 1, d]);
		});
		head.sort((a, b) => b[1] - a[1]);
		if (head.length > chart._count) {
			tail.unshift(...(head.splice(chart._count, head.length)));
		}
		var max = 0;
		head.forEach(item => {
			var v = item[1];
			if (v > max) max = v;
		});
		head.forEach((item, i) => {
			var ele = chart._bars[item[0]], value = Math.max(0, item[1]), color = BarColorList[i];
			if (!color) color = BarColorList.last;
			ele.style.top = (i * (BarHeight + BarSpan) + BarSpan) + 'px';
			ele.style.width = Math.round(chart._panelWidth * value / max) + 'px';
			ele.style.backgroundColor = color;
			ele._value.innerText = item[1];
		});
		tail.forEach(item => {
			var ele = chart._bars[item[0]], value = Math.max(0, item[1]);
			ele.style.top = (chart._count * (BarHeight + BarSpan) + BarSpan * 2) + 'px';
			ele.style.width = Math.round(chart._panelWidth * value / max) + 'px';
			ele.style.backgroundColor = BarColorList.last;
			ele._value.innerText = item[1];
		});

		chart._index ++;
		if (chart._index < chart._limit) {
			setTimeout(animateChart, chart._duration, chart);
		}
		else {
			if (!!chart._replay) {
				chart._replay.style.opacity = 1;
				chart._replay.style.pointerEvents = 'auto';
			}
			else if (chart._repeat > 0) {
				chart._index = 0;
				setTimeout(animateChart, chart._repeat, chart);
			}
		}
	};
	window.initTableAnimationChart = () => {
		[].forEach.call(document.querySelectorAll('div.animate-chart'), chart => {
			chart._duration = chart.getAttribute('duration') * 1;
			if (isNaN(chart._duration)) chart._duration = 1000;
			chart._repeat = chart.getAttribute('repeatwait') * 1;
			if (isNaN(chart._repeat)) chart._repeat = -1;
			chart._count = chart.getAttribute('barcount') * 1;
			if (isNaN(chart._count)) chart._count = 3;
			chart._hint = (chart.getAttribute('hint') || '').trim();

			chart._data = chart.querySelector('.animate-chart-data');
			if (!chart._data) {
				chart.parentNode.removeChild(chart);
				return;
			}
			chart._data = chart._data.innerText;
			if (!chart._data) {
				chart.parentNode.removeChild(chart);
				return;
			}
			try {
				chart._data = JSON.parse(chart._data);
			}
			catch {
				chart.parentNode.removeChild(chart);
				return;
			}

			var marginLeft = 0;
			chart._titleHint = chart.querySelector('.animate-chart-title-hint');
			chart._panel = chart.querySelector('.animate-chart-panel');
			chart._bars = [].map.call(chart._panel.querySelectorAll('.animate-chart-bar'), bar => {
				bar._value = bar.querySelector('.animate-chart-bar-value');
				var title = bar.querySelector('.animate-chart-bar-title');
				if (!!title) {
					let w = Math.ceil(title.getBoundingClientRect().width) + 10;
					if (w > marginLeft) marginLeft = w;
				}
				return bar;
			});
			chart._bars.unshift(null);
			chart._replay = chart.querySelector('.animate-chart-replay');
			if (!!chart._replay) {
				chart._replay.addEventListener('click', () => {
					chart._replay.style.opacity = 0;
					chart._replay.style.pointerEvents = 'none';
					chart._index = 0;
					animateChart(chart);
				});
			}

			chart._panel.style.height = Math.max(0, chart._count * (BarHeight + BarSpan) + BarSpan) + 'px';
			chart._panelWidth = chart._panel.getBoundingClientRect().width - marginLeft - BarRightMargin;
			chart._bars.forEach(bar => {
				if (!bar) return;
				bar.style.left = marginLeft + 'px';
			});
			chart._index = 0;
			chart._limit = chart._data.length;
			animateChart(chart);
		});
	};
}) ();