// function openCursor(callBack) {
// 	const openRequest = indexedDB.open('theStore', 1);
// 	openRequest.onsuccess = function () {
// 		const db = openRequest.result;
// 		const transaction = db.transaction('bookMarks', 'readonly');
// 		let bookMark = transaction.objectStore('bookMarks');
// 		bookMark.openCursor().onsuccess = callBack;
// 	};
// }

/**
 * 冒泡排序
 * @param {Array：排序数组} arr 
 * @param {String：排序键值} key 
 */
function popSort(arr, key) {
	for (let i = 0; i < arr.length - 1; i++) {
		for (let j = 0; j < arr.length - 1 - i; j++) {
			if (key) {
				if (arr[j + 1][key] >= arr[j][key]) {
					const temp = Object.assign({}, arr[j + 1]);
					arr[j + 1] = Object.assign({}, arr[j]);
					arr[j] = temp;
				};
			} else {
				if (arr[j + 1] >= arr[j]) {
					const temp = arr[j + 1];
					arr[j + 1] = arr[j];
					arr[j] = temp;
				};
			}
		};
	};
	return arr;
}

function init() {
	const contain = document.getElementById('bookMarks');
	const openRequest = indexedDB.open('theStore', 1);
	openRequest.onsuccess = function () {
		const db = openRequest.result;
		const searchBox = document.getElementById('searchBox');
		const search = document.getElementById('search');
		search.onclick = function searchBooksMarks(params) {
			contain.innerHTML = ``;
			const value = searchBox.value;
			const transaction = db.transaction('bookMarks', 'readonly');
			let bookMark = transaction.objectStore('bookMarks');
			let search_count = 0;
			const DOM_nonresult = document.createElement('li');
			DOM_nonresult.innerText = "无相应书签"
			bookMark.openCursor().onsuccess = function (event) {
				var cursor = event.target.result;
				if (cursor) {
					if (cursor.value.title.indexOf(value) !== -1 || cursor.value.title.toLowerCase().indexOf(value.toLowerCase()) !== -1) {
						search_count++;
						const DOM_li = document.createElement('li');
						DOM_li.innerText = cursor.value.title;
						DOM_li.setAttribute('url', cursor.value.url);
						DOM_li.onclick = function (event) {
							console.info(cursor.value)
							chrome.tabs.create({
								url: event.target.getAttribute('url')
							});
						};
						contain.append(DOM_li);
					};
					cursor.continue();
				};
				if (search_count === 0) {
					contain.append(DOM_nonresult);
				} else {
					DOM_nonresult.remove();
				}
			};
		};
		//将数据库遍历，BOOKMARK_COUNT>0的按照从大到小排序，添加到contain中
		function checkBookMarks() {
			contain.innerHTML = ``;
			const transaction = db.transaction('bookMarks', 'readonly');
			const bookMarks = transaction.objectStore('bookMarks');
			const valueCache = [];
			bookMarks.openCursor().onsuccess = function (event) {
				const cursor = event.target.result;
				if (cursor) {
					if (cursor.value.BOOKMARK_COUNT && cursor.value.BOOKMARK_COUNT > 0) {
						//排序并展示统计量前十书签
						const obj = Object.assign({}, cursor.value);
						valueCache.push(obj);
					};
					cursor.continue();
				}
			};
			//页面添加点击量前十的书签
			//待优化
			setTimeout(() => {
				const result = popSort(valueCache, 'BOOKMARK_COUNT');
				//页面中添加书签
				result.map(item => {
					const DOM_li = document.createElement('li');
					DOM_li.innerHTML = `<div title="${item.title}">${item.title}</div><div>${item.BOOKMARK_COUNT}</div>`;
					DOM_li.setAttribute('url', item.url);
					DOM_li.onclick = function (event) {
						chrome.tabs.create({
							url: item.url
						});
					};
					contain.append(DOM_li);
				})
			}, 100);
		};
		checkBookMarks();

		//清空书签点击量
		function clearMarkCount() {
			const transaction = db.transaction('bookMarks', 'readonly');
			const bookMarks = transaction.objectStore('bookMarks');
			bookMarks.openCursor().onsuccess = function (event) {
				const cursor = event.target.result;
				if (cursor) {
					if (cursor.value.BOOKMARK_COUNT) {
						const transaction = db.transaction('bookMarks', 'readwrite');
						const bookMarks = transaction.objectStore('bookMarks');
						bookMarks.put(Object.assign({}, cursor.value, { BOOKMARK_COUNT: 0 }));
					};
					cursor.continue();
				};
			};
		};
		document.getElementById('clear').onclick = function (params) {
			if (confirm('是否清空标签统计数据')) {
				clearMarkCount();
				contain.innerHTML = ``;
			};
		};
	};
};
window.onload = init;
