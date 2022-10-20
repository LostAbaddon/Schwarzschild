<template>
	<div :class="'imageShowcase ' + (show ? 'show' : 'hide')" @click="onClick">
		<div class="imageFrame">
			<div class="imagePage" v-for="(image, i) in gallary" :style="{left: ((i - index) * 100) + '%'}">
				<div class="imageInstance" :style="{backgroundImage: 'url(' + image.image + ')', width: image.width + 'px'}" :width="image.width" :height="image.height"></div>
				<div class="imageLegend">{{image.title}}</div>
			</div>
		</div>
		<div class="imageButton close" @click="show=false"><i class="fas fa-times-circle"></i></div>
		<div class="imageButton left" :inactive="index <= 0" @click="index --"><i class="fas fa-angle-left"></i></div>
		<div class="imageButton right" :inactive="index >= gallary.length - 1" @click="index ++"><i class="fas fa-angle-right"></i></div>
	</div>
</template>

<script>
const findWall = ele => {
	var parent = ele.parentNode;
	if (!parent) return null;
	var tag = parent.tagName;
	if (!tag) return null;
	tag = tag.toLowerCase();
	if (tag === 'figure') return findWall(parent);
	if (tag !== 'div') return null;
	if (parent.classList.contains('image-wall')) return parent;
	return findWall(parent);
};
export default {
	name: 'ImageShowcase',
	data () {
		return {
			show: false,
			index: 0,
			gallary: []
		}
	},
	created () {
		document.body.addEventListener('click', evt => {
			if (this.show) return;
			var ele = evt.target, tag = ele.tagName;
			if (!tag) return;
			tag = tag.toLowerCase();
			var hitted = false, img, wall;
			if (tag === 'img') {
				hitted = true;
				img = ele;
				wall = findWall(ele);
			}
			else if (tag === 'figure') {
				img = ele.querySelector('img');
				if (!!img) {
					hitted = true;
					wall = findWall(ele);
				}
			}
			else if (tag === 'div') {
				if (ele.classList.contains('resource')) {
					img = ele.querySelector('img');
					if (!!img) {
						hitted = true;
						wall = findWall(ele);
					}
				}
			}
			if (!hitted) return;

			var gallary = [], index = 0;
			if (!!wall) {
				wall.querySelectorAll('.image-container.image-float div.resource.image').forEach((g, i) => {
					var pic = g.querySelector('img');
					if (pic === img) index = i;
					var title = g.querySelector('figcaption');
					title = title.innerText || ""
					gallary.push({
						image: pic.src,
						width: pic.naturalWidth,
						height: pic.naturalHeight,
						title
					});
				});
			}
			else {
				index = 0;
				let title = img.parentNode;
				if (!!title) title = title.parentNode;
				if (!!title) title = title.querySelector('figcaption');
				if (!!title) title = title.innerText;
				title = title || '';
				gallary = [{
					image: img.src,
					width: img.naturalWidth,
					height: img.naturalHeight,
					title
				}];
			}
			this.showGallary(index, gallary);
		});
		document.body.addEventListener('keydown', evt => {
			if (!this.show) return;
			if (evt.keyCode === 37) {
				if (evt.ctrlKey) {
					this.index = 0;
				}
				else if (this.index > 0) {
					this.index --;
				}
			}
			else if (evt.keyCode === 39) {
				if (evt.ctrlKey) {
					this.index = this.gallary.length - 1;
				}
				else if (this.index < this.gallary.length - 1) {
					this.index ++;
				}
			}
			else if (evt.keyCode === 27) {
				this.show = false;
			}
			else {
				return;
			}
			evt.preventDefault();
		});
	},
	methods: {
		onClick (evt) {
			if (evt.target.classList.contains('fas')) return;
			if (!!evt.target.querySelector('.fas')) return;

			if (!!evt.target.querySelector('.imageInstance')) {
				this.show = false;
				return;
			}
			if (!evt.target.classList.contains('imageInstance')) return;

			var width = evt.target.getAttribute('width') * 1 || 0;
			var height = evt.target.getAttribute('height') * 1 || 0;
			var w = evt.target.getBoundingClientRect();
			var h = w.height;
			w = w.width;
			var x = evt.offsetX, y = evt.offsetY;
			var limitX = 0, limitY = 0;

			if (width <= w) {
				if (height > h) {
					let ww = width / height * h;
					limitX = (w - ww) / 2;
				}
				else {
					limitX = (w - width) / 2;
					limitY = (h - height) / 2;
				}
			}
			else {
				let ww = w, hh = height / width * w;
				if (hh > h) {
					ww = w / hh * h;
					hh = h;
				}
				limitX = (w - ww) / 2;
				limitY = (h - hh) / 2;
			}

			if (x > w / 2) x = w - x;
			if (y > h / 2) y = h - y;
			if (x < limitX || y < limitY) this.show = false;
		},
		showGallary (index, gallary) {
			this.index = index;
			this.gallary.splice(0, this.gallary.length, ...gallary);
			this.show = true;
		}
	}
}
</script>