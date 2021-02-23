<template>
	<section class="column-item" :filename="categoryPath+'/'+filename" :timestamp="timestamp" :author="author">
		<header>
			<div class="title">{{title}}</div>
			<div class="category" :path="categoryPath">{{categoryName}}</div>
		</header>
		<article>{{description}}</article>
		<footer>
			<div class="author">{{author}}</div>
			<div class="timestamp">{{timemark}}</div>
		</footer>
	</section>
</template>

<script>
export default {
	name: "ColumnItem",
	props: {
		title: String,
		author: String,
		description: String,
		type: String,
		timemark: String,
		timestamp: Number,
		categoryName: String,
		categoryPath: String,
		filename: String
	}
}
</script>