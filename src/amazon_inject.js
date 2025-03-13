// This script is run when visiting an Amazon page

// This script is run when visiting a Goodreads page

var libraryDivPlaceholders = "";
var tableUpdateCheckInterval = null;
var showOnPages = {};
var showFormat = {};
var libraryClassNames = [];
var waitingOnAvailability = false;
var loaded = false;

// for title and author remove parentheticals, remove [&|,], and trim whitespace
function cleanTitleForSearch(title) {
	return title.replace(/\(.*\)/, "").replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/: .*/, '').replace(/[ ]+/, ' ');
}
function cleanAuthorForSearch(author) {
	return author.replace(/^\s+|\s+$/g, '').replace(/[&|,]/g, ' ').replace(/(?:^|\W)(?:[A-Z]\.)+/g, ' ').replace(/[ ]+/, ' ');
}

function getBookDetails() {
    const titleElement = document.querySelector("#productTitle");
    const authorElement = document.querySelector(".author a");

    if (!titleElement) {
        console.log("❌ Book title not found.");
        return null;
    }

    return {
        title: titleElement.textContent.trim(),
        author: authorElement ? authorElement.textContent.trim() : "Unknown"
    };
}

function createSingleBookPageTable(headerText, id) {
	return `<div id='AGtable' style='position:relative'>
<div class='ARcontainer'>
<b>Availability on ${headerText}:</b>\
<div class='ARtable' id='AGAVAIL${id}'>
</div>
<a href='#' id='ARshowMore${id}' class='ARshowMoreInSinglePage ARhidden button Button--small '>show more
<button type="button" class="Button Button--inline Button--small"><span class="Button__labelItem"><i class="Icon ChevronIcon"><svg viewBox="0 0 24 24"><path d="M8.70710678,9.27397892 C8.31658249,8.90867369 7.68341751,8.90867369 7.29289322,9.27397892 C6.90236893,9.63928415 6.90236893,10.2315609 7.29289322,10.5968662 L12,15 L16.7071068,10.5968662 C17.0976311,10.2315609 17.0976311,9.63928415 16.7071068,9.27397892 C16.3165825,8.90867369 15.6834175,8.90867369 15.2928932,9.27397892 L12,12.3542255 L8.70710678,9.27397892 Z" transform="rotate(0 12 12)"></path></svg></i></span></button>
</a></div></div>`
};

function onClickShowMore(id) {
	return function (event) {
		event.preventDefault();

		const table = document.getElementById("AGAVAIL" + id);
		table.classList.remove("ARfade");

		const hiddenRows = table.children;
		for (var row of hiddenRows) {
			row.classList.remove("ARhidden");
			row.classList.add("ARrow");
		};

		const showMoreLink = document.getElementById("ARshowMore" + id);
		showMoreLink.classList.add("ARclicked");
	}
}

// send search requests to Overdrive
function getOverdriveAvailability() {
	/*if (!libraryDivPlaceholders || libraryDivPlaceholders.length == 0) {
		return;
	}*/

	// check for tags on either a single book review page or the bookshelf page
	const bookDetails = getBookDetails();
    console.log(bookDetails);
	var headerText = "Libby";
	// if (showFormat.linkToOverdriveResults) {
	// 	headerText = "Overdrive";
	// }
	
	// if a single book page
		const id = "SINGLEBOOK";

    // inject the table we're going to populate
    const buyBox = document.querySelector("#buybox") || document.querySelector("#desktop_buybox") || document.querySelector("#rightCol");
    buyBox.insertAdjacentHTML("afterbegin", createSingleBookPageTable(headerText, id));

    const showMoreLink = document.getElementById("ARshowMore" + id);
    showMoreLink.addEventListener("click", onClickShowMore(id));

    // if (showFormat.oneLine) {
    //     const div = document.getElementById("AGAVAIL" + id);
    //     div.classList.add("ARSingleoneLine");
    // }

    // send a message for the background page to make the request


    chrome.runtime.sendMessage({
        type: "FROM_AG_PAGE",
        id: id,
        title: cleanTitleForSearch(bookDetails.title),
        author: cleanAuthorForSearch(bookDetails.author)
    }); 
    console.log("sent message");
	}


function injectAvailableReads() {
	if (!loaded) {
		loaded = true;
			// if document has been loaded, inject CSS styles
			document.getElementsByTagName('body')[0].insertAdjacentHTML("beforebegin", `<style>
					#AGtable a{text-decoration:none;}
					.ARcontainer {position:relative}
					.AGcol { position:relative}
					.ARSingleoneLine { max-width: 700px; white-space: nowrap; overflow:hidden }
					.ARListoneLine { max-width: 400px; white-space: nowrap; overflow:hidden }
					.ARShelfoneLine { max-width: 300px; white-space: nowrap; overflow:hidden }
					div img.AGaudio{margin-left:5px;margin-bottom:1px}
					span img.AGaudio{margin-left:-1px;margin-right:3px;margin-bottom:1px}
					.AGline{display:none;}
					font:hover hr.AGline{margin-left:5px;border:thin solid #c6c8c9;position:absolute;display:inline}
					.AGtitle{display:none;}
					.ARtable td.ARimg{text-wrap:nowrap;padding:0px;display:block}
					font:hover span.AGtitle{z-index:999;background-color:white;position: absolute;margin-left:10px;margin-top:-1px;padding-left:5px;padding-right:5px;display:inline;border:thin solid #c6c8c9}
					.flip-vertical {-moz-transform: scaleY(-1);-webkit-transform: scaleY(-1);-o-transform: scaleY(-1);transform: scaleY(-1);-ms-filter: flipv; /*IE*/filter: flipv;}
					.ARshowMoreInSinglePage { position:absolute; right: 15px; bottom: 8px; height:auto; background:white; padding-right: 0px} 
					.ARshowMoreInList { padding:3px; position:absolute; right: 15px; bottom: 8px; height:auto; background:white;} 
					.ARshowMoreInShelf { height:auto; } 
					.ARhidden { display:none }
					.ARclicked { display:none }
					.ARresultstatus {white-space: nowrap}
					.ARfade {
						-webkit-mask-image: linear-gradient(to bottom, black calc(100% - 30px), transparent 100%);
						mask-image: linear-gradient(to bottom, black calc(100% - 30px), transparent 100%);
					  }
					.ARsmaller { font-size: 80% }
					.ARdesc { text-align: left; padding-left: 1px; }
					.ARrow { display: flex; }
					</style>`);
		chrome.storage.sync.get(null, function(obj) {
			showOnPages = obj["showOnPages"];
			showFormat = obj["showFormat"];
            console.log("loaded!");
			getOverdriveAvailability();
		});
	}
};

function limitResultsShown(id) {
	const table = document.getElementById("AGAVAIL" + id);
	const showMore = document.getElementById("ARshowMore" + id);
   
	if (table.children && !showMore.classList.contains("ARclicked")) {
		for (var i = 0, row; row = table.children[i]; i++) {
			if (i >= showFormat.limitResultCount) {
				row.classList.add("ARhidden");
				row.classList.remove("ARrow");
				showMore.classList.remove("ARhidden");
			} else {
				row.classList.remove("ARhidden");
				row.classList.add("ARrow");
			}
		}
		const delta = table.children.length - showFormat.limitResultCount;
		if (delta > 0) {
			showMore.textContent = "show " + delta + " more";
			showMore.classList.remove("ARhidden")
			table.classList.add("ARfade")
		} else {
			showMore.classList.add("ARhidden")
		}
	}
}

// wait for the document to load before injecting code
window.addEventListener("load", (event) => injectAvailableReads);
// if in Firefox we missed the load event, add after a delay
setTimeout(injectAvailableReads, 3000);

function insertRow(id, imgCol, descCol, sortScore, hideNotFoundIfOtherResults, notFoundOrder) {
	const table = document.getElementById("AGAVAIL" + id);
   
	if (table.children) {
		var i = 0, row = null;
		for (i = 0; row = table.children[i]; i++) {
			var rowSortScore = row.getAttribute("ARsortScore");
			if (sortScore < rowSortScore) {
				break;
			}
		}
		if (i == 0) {
			table.setAttribute("ARsortScore", sortScore);
		}
	}

	const rowDiv = document.createElement("div");
	rowDiv.classList.add("ARrow");
	table.insertBefore(rowDiv, row);

	const imgCell = document.createElement("div");
	imgCell.classList.add("ARimg");
	rowDiv.appendChild(imgCell);

	const descCell = document.createElement("div");
	descCell.classList.add("ARdesc");
	rowDiv.appendChild(descCell);

	rowDiv.setAttribute("ARsortScore", sortScore);
	imgCell.innerHTML = imgCol;
	descCell.innerHTML = descCol;

	if (hideNotFoundIfOtherResults) {
		if (table.children) {
			for (var i = 0, row; row = table.children[i]; i++) {
				var rowSortScore = row.getAttribute("ARsortScore");
				if (rowSortScore == notFoundOrder) {
					table.removeChild(row);
					break;
				}
			}
		}
	}

	if (showFormat.limitResultCount > 0) {
		limitResultsShown(id);
	}
}

function addOrUpdateNotFoundRow(message, resultsUrl, notFoundOrder, hideNotFoundIfOtherResults) {
	const table = document.getElementById("AGAVAIL" + message.id);
	if (table.children) {
		for (var i = 0, row; row = table.children[i]; i++) {
			var rowSortScore = row.getAttribute("ARsortScore");
			if (rowSortScore == notFoundOrder) {
				if (!showFormat.hideLibrary) {
					row.innerHTML = row.innerHTML.replace("\"> at ", "\"> at <a href='" + resultsUrl + "'>" + message.libraryShortName + "</a>, ");
				}
				return;
			} else if (hideNotFoundIfOtherResults) {
				return;
			}
		}
	}

	const statusColor = "gray";
	const statusText = "not found";
	const sortScore = notFoundOrder;

	var library = "";
	if (!showFormat.hideLibrary) {
		library = " at " + message.libraryShortName;
	}

	const descCol = "<div class=ARdesc><span><font color=" + statusColor + ">" + statusText + "</font><a href='"+ resultsUrl + "'>" + library + "</a></span>" +
		"<br/>&nbsp;&nbsp;<span class='ARsmaller'>Searched for: <a href='"+ resultsUrl + "'><i>" + message.searchTitle + "</i> by <i>" + message.searchAuthor + "</i></a></span></div>";

	insertRow(message.id, "<img>", descCol, sortScore, false, notFoundOrder);
}

function parseResultsMessage(message, sender, sendResponse) {
    console.log(message);
	const endOfList     = 99999999;
	const requestOrder  = endOfList;
	const notFoundOrder = endOfList * 10;
	const errorOrder    = endOfList * 100;
	const hideNotFoundIfOtherResults = message.hideNotFoundIfOtherResults;

	if (!message || !message.searchUrls || message.searchUrls === undefined) {
		console.log(message);
	}
	var resultsUrl = message.searchUrls.libby;
	if (showFormat.linkToOverdriveResults) {
		resultsUrl = message.searchUrls.overdrive;
	}

	for (const book of message.books) {		
		var statusColor = "red";
		var statusText = "error searching";
		var sortScore = errorOrder;

		resultsUrl = book.libbyResultUrl;
		if (showFormat.linkToOverdriveResults) {
			resultsUrl = book.searchUrls.overdrive;
		}
		
		// if an audiobook, add a headphone icon
		if (book.isAudio) {
			audioStr = "<span class=ARaudiobadge>🎧</span>";
		} else {
			audioStr = "";
		}

		if (book.alwaysAvailable) { // if always available
			statusText = "always available";
			statusColor = "#080";
			sortScore = endOfList * -1;

		} else if (book.totalCopies && book.holds != null && book.holds >= 0) { // if there's a wait list with count
			var holdsRatio = ", " + book.holds + "/" + book.totalCopies + " holds";

			var estimateStr = book.estimatedWaitDays;
			if (!estimateStr) {
				estimateStr = "no estimate" + holdsRatio;
				holdsRatio = "";
				sortScore = book.holds * 14 + 10;
			} else {
				if (estimateStr == 1) {
					estimateStr += " day"
				} else {
					estimateStr += " days"
				}
				sortScore = book.estimatedWaitDays + 10;
			}

			if (!message.showHoldsRatio) {
				holdsRatio = "";
			}

			statusColor = "#C80";
			statusText = estimateStr + holdsRatio;
		
		} else if (book.holds && isNaN(book.holds)) { // if there's a wait list with no count
			statusColor = "#C80";
			statusText = "place hold";
			sortScore = requestOrder;
			if (book.estimatedWaitDays >= 0) {
				sortScore = book.estimatedWaitDays + 10;
			}

		} else if ((!book.availableCopies && book.isRecommendableToLibrary) || (!book.totalCopies == 0 && book.request)) { // if no copies but request is an option
			statusColor = "#C60";
			statusText = "request";
			sortScore = requestOrder;

		} else if (book.availableCopies > 0) { // if available copies found with count
			statusColor = "#080";
			statusText = book.availableCopies + " available";
			sortScore = book.availableCopies * -1;

		} else if (!book.totalCopies) { // if no copies found
			addOrUpdateNotFoundRow(message, resultsUrl, notFoundOrder, hideNotFoundIfOtherResults);
			continue;
		}

		var imgCol = "";
		if (book.imgUrl) {
			var imgHeight = 40;
			if (showFormat.oneLine) {
				imgHeight = 20;
			} 

			imgCol = "<a href='" + resultsUrl + "'><img style='max-width:none' src='" + book.imgUrl + "' height=" + imgHeight + "px></a>";
		}

		var titleAndAuthor = "<br/>";
		var prependAudioStr = "";
		if (showFormat.oneLine) {
			titleAndAuthor = " - "
		}
		if (showFormat.hideTitleAndAuthor) {
			titleAndAuthor = "";
			prependAudioStr = audioStr;
		} else {
			titleAndAuthor += "<span class='ARtitle'>" + audioStr + book.title + " by " + book.author + "</span>"
		}

		var library = "";
		if (!showFormat.hideLibrary) {
			library = " at " + message.libraryShortName;
		}

		const descCol = "<div class=ARdesc><span class=ARresultstatus><a href='" + resultsUrl + "'><font color='" + statusColor + "'>" + prependAudioStr + statusText + "</font></a>" + 
			library + "</span>" +
			titleAndAuthor + "</div>";

		insertRow(message.id, imgCol, descCol, sortScore, hideNotFoundIfOtherResults, notFoundOrder);
	}

	if (!message.books || message.books.length == 0) {
		addOrUpdateNotFoundRow(message, resultsUrl, notFoundOrder, hideNotFoundIfOtherResults);
	}
}

chrome.runtime.onMessage.addListener(parseResultsMessage);
