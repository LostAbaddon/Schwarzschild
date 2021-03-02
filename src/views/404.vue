<template>
	<div class="page_not_found">
		<div class="frame"></div>
		<div class="title">星系正在构建中，请星侠稍后！<br><span>（如新页面打开后进入这里，请关闭浏览器页面重新打开试试！）</span></div>
	</div>
</template>

<script>
export default {
	name: 'PageNotFound',
	mounted () {
		callPageLoaded();
	}
}
</script>