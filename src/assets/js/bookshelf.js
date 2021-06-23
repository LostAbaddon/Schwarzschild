window.BookShelf = {
	name: 'localBookShelf',
	DB: null,
	async init () {
		BookShelf.DB = new CachedDB(BookShelf.name, 1);
		BookShelf.DB.onUpdate(() => {
			BookShelf.DB.open('article', 'id');
			BookShelf.DB.open('category', 'path');
			console.log('BookShelf::CacheStorage Updated');
		});
		BookShelf.DB.onConnect(() => {
			console.log('BookShelf::CacheStorage Connected');
		});
		await BookShelf.DB.connect();
	},
};