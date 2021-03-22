// CC 版权信息，LikeCoin 设置
MarkUp.addExtension({
	name: 'CC&Like',
	parse: (line, doc, caches) => {
		var match = line.match(/^[ 　\t]*COPYRIGHT:[ 　\t]*(.*?)[ 　\t]*$/);
		if (!!match) {
			doc.metas.others = doc.metas.others || {};
			doc.metas.others.CopyRight = match[1];
			return ["", true];
		}
		match = line.match(/^[ 　\t]*LIKECOIN:[ 　\t]*(.*?)[ 　\t]*$/);
		if (!!match) {
			doc.metas.others = doc.metas.others || {};
			doc.metas.others.LikeCoin = match[1];
			return ["", true];
		}
		return [line, false];
	},
}, 0, -1);

// 引用与转发
MarkUp.addExtension({
	name: 'Cite&Repost',
	parse: (line, doc, caches) => {
		var changed = false;
		line = line.replace(/<\[(\d+)\]>/g, (match, index) => {
			var key = 'CITE-' + MarkUp.generateRandomKey();
			caches[key] = '<a href="#CITE-' + index + '">[' + index + ']</a>';
			changed = true;
			return '%' + key + '%';
		});

		var match = line.match(/^[ 　\t]*CITE-(\d+):[ 　\t]*(.*?)[ 　\t]*$/);
		if (!!match) {
			doc.metas.others = doc.metas.others || {};
			doc.metas.others.Cites = doc.metas.others.Cites || [];
			var index = match[1] * 1;
			if (!isNaN(index)) {
				doc.metas.others.Cites[index] = match[2];
				return ["", true];
			}
		}
		match = line.match(/^[ 　\t]*REPOST:[ 　\t]*(.*?)[ 　\t]*$/);
		if (!!match) {
			doc.metas.others = doc.metas.others || {};
			doc.metas.others.Reposts = doc.metas.others.Reposts || [];
			doc.metas.others.Reposts.push(match[1]);
			return ["", true];
		}
		return [line, changed];
	},
}, 0, -1);
MarkUp.addExtension({
	name: 'Cite&Repost',
	parse: (text, doc) => {
		var content = [], hasCites = false, hasReposts = false;
		if (!!doc.metas.others) {
			if (!!doc.metas.others.Cites && doc.metas.others.Cites.length > 0) {
				hasCites = true;
				content.push('<section class="cite-list"><h1><a name="CITE-LIST">引用文献</a></h1>');
				doc.metas.others.Cites.forEach((cite, index) => {
					if (!cite) return;
					content.push('<p><a class="cite-marker" name="CITE-' + index + '">[' + index + ']</a>: ' + MarkUp.parseLine(cite, doc) + '</p>');
				});
				content.push("</section>");
			}
			if (!!doc.metas.others.Reposts && doc.metas.others.Reposts.length > 0) {
				hasReposts = true;
				content.push('<section class="repost-list"><h1><a name="REPOST-LIST">转载平台</a></h1><ul>');
				doc.metas.others.Reposts.forEach(repost => {
					content.push('<li><a href="' + repost + '" target="_blank">' + repost + '</a></li>');
				});
				content.push("</ul></section>");
			}
		}
		text = text.replace(/<\/article>[ 　\t\n\r]*$/, content.join('') + "</article>");
		if (content.length > 0) {
			// 添加尾部引用与转载列表
			content = [];
			if (hasCites) {
				content.push('<p class="content-item level-1"><span class="content-indent"></span><a class="content-link" href="#CITE-LIST">引用文献</a></p>');
			}
			if (hasReposts) {
				content.push('<p class="content-item level-1"><span class="content-indent"></span><a class="content-link" href="#REPOST-LIST">转载平台</a></p>');
			}
			// 更新目录
			text = text.replace(/(<aside class="content-table">)([\w\W]*?)(<\/aside>)/g, (match, pre, list, post) => {
				return pre + list + content.join('') + post;
			});
		}
		return text;
	},
}, 2, -1);


// 将原始ASCII字符都分离出来
MarkUp.addExtension({
	name: 'ASCII-Chars',
	parse: (line, doc, caches) => {
		var changed = false;
		if (!doc.mainParser) return [line, changed];

		var last = 0;
		var contents = [];
		line.replace(/(<.*?>|%.*?%|\[.*?\]|\{.*?\})/gi, (match, nouse, pos) => {
			if (pos > last) {
				contents.push([false, line.substring(last, pos)]);
			}
			contents.push([true, match]);
			last = pos + match.length;
		});
		if (last < line.length) {
			contents.push([false, line.substring(last, line.length)]);
		}

		line = [];
		contents.forEach(part => {
			if (part[0]) return;
			var ctx = part[1].replace(/[\w \-\+\.,:;\?!\*`@#$%^&\(\)\[\]\{\}=_'"\\\/<>\|]+/g, (match) => {
				if (!match.match(/[a-zA-Z]/)) return match;
				return '</span><span class="english">' + match.trim() + '</span><span class="normal">'
			});
			ctx = '<span class="normal">' + ctx + '</span>';
			part[1] = ctx.replace(/<span class="normal"> *<\/span>/g, '');
		});
		contents.forEach(part => {
			line.push(part[1]);
		});
		line = line.join('');
		return [line, changed];
	},
}, 0, 999);