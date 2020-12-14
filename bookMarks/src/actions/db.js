const openRequest = indexedDB.open('theStore', 1);
openRequest.onsuccess = function () {
	const db = openRequest.result;
	/**
 * 改变数据库中的数据
 * @param {bookmarkNode} newVal 
 */
	function changeDB(newVal) {
		const transaction = db.transaction('bookMarks', 'readwrite');
		const bookMark = transaction.objectStore('bookMarks');
		const request = bookMark.put(newVal);
		request.onerror = function (err) {
			console.info(err);
		}
	}
	chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tabs) {
		if (changeInfo.status) {
			if (changeInfo.status === 'complete') {
				//遍历数据库，title或url相等，BOOKMARK_COUNT++
				const transaction = db.transaction('bookMarks', 'readonly');
				const bookMark = transaction.objectStore('bookMarks');
				const request = bookMark.openCursor();
				request.onsuccess = function (event) {
					const cursor = event.target.result;
					if (cursor) {
						if (cursor.value.url === tabs.url || cursor.value.title === tabs.title) {
							const newVal = Object.assign({}, cursor.value);
							if (!newVal.BOOKMARK_COUNT) {
								newVal['BOOKMARK_COUNT'] = 0;
							};
							newVal.BOOKMARK_COUNT++;
							changeDB(newVal);
						};
						cursor.continue();
					};
				};
			};
		};
	});
	//书签被创建或删除后，更新数据库内容
	chrome.bookmarks.onCreated.addListener(function (id, info) {
		if (info.node.url) {
			changeDB(info.node);
		}
	});
	chrome.bookmarks.onRemoved.addListener(function (id, info) {
		if (info.url) {
			const transaction = db.transaction('bookMarks', 'readwrite');
			const bookMark = transaction.objectStore('bookMarks');
			bookMark.delete(id);
		}
	});
};
//数据库初始化或数据库版本更新
openRequest.onupgradeneeded = function () {
	let db = openRequest.result;
	//如果数据库没有bookMarks数据
	if (!db.objectStoreNames.contains('bookMarks')) {
		let bookMarks = db.createObjectStore('bookMarks', { keyPath: 'id' });
		bookMarks.createIndex('title_index', 'title');
	};
	chrome.bookmarks.getTree(function (nodes) {
		addNode(db, nodes);
	});
	function addNode(db, nodeList) {
		for (item of nodeList) {
			if (item.hasOwnProperty('children')) {
				addNode(db, item.children)
			} else {
				//创建事务
				let transaction = db.transaction('bookMarks', "readwrite");
				let bookMarks = transaction.objectStore('bookMarks');
				let bookMark = item;
				const bookMarkNode = Object.assign({ BOOKMARK_COUNT: 0 }, item);
				bookMarks.add(bookMark);
			}
		}
	};
};
//数据库异常
openRequest.onerror = function () {
	console.warn(openRequest.error);
};
