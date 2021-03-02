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
}) ();