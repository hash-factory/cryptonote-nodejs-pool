/**
 * Common javascript code for cryptonote-nodejs-pool
 * Author: Daniel Vandal
 * GitHub: https://github.com/dvandal/cryptonote-nodejs-pool
 **/

/**
 * Layout
 **/
 
// Collapse menu on load for mobile devices
$('#menu-content').collapse('hide');

/**
 * Cookies handler
 **/

var docCookies = {
    getItem: function (sKey) {
        return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toUTCString();
                    break;
            }
        }
        document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },
    removeItem: function (sKey, sPath, sDomain) {
        if (!sKey || !this.hasItem(sKey)) { return false; }
        document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
        return true;
    },
    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    }
};

/**
 * Pages routing
 **/

// Current page
var currentPage;

// Handle hash change
window.onhashchange = function(){
    routePage();
};

// Route to page
var xhrPageLoading;
function routePage(loadedCallback) {
    if (currentPage) currentPage.destroy();
    $('#page').html('');
    $('#loading').show();

    if (xhrPageLoading) {
        xhrPageLoading.abort();
    }

    $('.hot_link').parent().removeClass('active');
    var $link = $('a.hot_link[href="' + (window.location.hash || '#') + '"]');
    
    $link.parent().addClass('active');
    var page = $link.data('page');
    
    loadTranslations();

    xhrPageLoading = $.ajax({
        url: 'pages/' + page,
        cache: false,
        success: function (data) {
            $('#menu-content').collapse('hide');
            $('#loading').hide();
            $('#page').show().html(data);
	    loadTranslations();
            if (currentPage) currentPage.update();
            if (loadedCallback) loadedCallback();
        }
    });
}

/**
 * Strings
 **/
 
// Add .update() custom jQuery function to update text content
$.fn.update = function(txt){
    var el = this[0];
    if (el.textContent !== txt)
        el.textContent = txt;
    return this;
};

// Update Text classes
function updateTextClasses(className, text){
    var els = document.getElementsByClassName(className);
    if (els) {
        for (var i = 0; i < els.length; i++){
            var el = els[i];
            if (el && el.textContent !== text)
                el.textContent = text;
        }
    }
}

// Update Text content
function updateText(elementId, text){
    var el = document.getElementById(elementId);
    if (el && el.textContent !== text){
        el.textContent = text;
    }
    return el;
}

// Convert float to string
function floatToString(float) {
    return float.toFixed(6).replace(/\.0+$|0+$/, '');
}

// Format number
function formatNumber(number, delimiter){
    if(number != '') {
        number = number.split(delimiter).join('');

        var formatted = '';
        var sign = '';

        if(number < 0){
            number = -number;
            sign = '-';
        }

        while(number >= 1000){
            var mod = number % 1000;

            if(formatted != '') formatted = delimiter + formatted;
            if(mod == 0) formatted = '000' + formatted;
            else if(mod < 10) formatted = '00' + mod + formatted;
            else if(mod < 100) formatted = '0' + mod + formatted;
            else formatted = mod + formatted;

            number = parseInt(number / 1000);
        }

        if(formatted != '') formatted = sign + number + delimiter + formatted;
        else formatted = sign + number;
        return formatted;
    }
    return '';
}

// Format date
function formatDate(time){
    if (!time) return '';
    return new Date(parseInt(time) * 1000).toLocaleString();
}

// Format percentage
function formatPercent(percent) {
    if (!percent && percent !== 0) return '';
    return percent + '%';
}

// Get readable time
function getReadableTime(seconds){
    var units = [ [60, 'second'], [60, 'minute'], [24, 'hour'],
                [7, 'day'], [4, 'week'], [12, 'month'], [1, 'year'] ];

    function formatAmounts(amount, unit){
        var rounded = Math.round(amount);
	var unit = unit + (rounded > 1 ? 's' : '');
        if (getTranslation(unit)) unit = getTranslation(unit);
        return '' + rounded + ' ' + unit;
    }

    var amount = seconds;
    for (var i = 0; i < units.length; i++){
        if (amount < units[i][0]) {
            return formatAmounts(amount, units[i][1]);
    }
        amount = amount / units[i][0];
    }
    return formatAmounts(amount,  units[units.length - 1][1]);
}

// Get readable hashrate
function getReadableHashRateString(hashrate){
    if (!hashrate) hashrate = 0;

    var i = 0;
    var byteUnits = [' H', ' kH', ' MH', ' GH', ' TH', ' PH' ];
    if (hashrate > 0) {
        while (hashrate > 1000){
            hashrate = hashrate / 1000;
            i++;
        }
    }
    return parseFloat(hashrate).toFixed(2) + byteUnits[i];
}
    
// Get coin decimal places
function getCoinDecimalPlaces() {
    if (typeof coinDecimalPlaces != "undefined") return coinDecimalPlaces;
    else if (lastStats.config.coinDecimalPlaces) return lastStats.config.coinDecimalPlaces;
    else lastStats.config.coinUnits.toString().length - 1;
}

// Get readable coins
function getReadableCoins(coins, digits, withoutSymbol){
    var coinDecimalPlaces = getCoinDecimalPlaces();
    var amount = parseFloat((parseInt(coins || 0) / lastStats.config.coinUnits).toFixed(digits || coinDecimalPlaces));
    return amount.toString() + (withoutSymbol ? '' : (' ' + lastStats.config.symbol));
}
// Get readable coin
function getReadableCoin(coins, digits, withoutSymbol){
    var coinDecimalPlaces = getCoinDecimalPlaces();
    var amount = parseFloat((parseInt(coins || 0) / lastStats.config.coinUnits).toFixed(digits || coinDecimalPlaces));
    return amount.toString() + (withoutSymbol ? '' : (' ' + lastStats.config.symbol));
}

// Format payment link
function formatPaymentLink(hash){
    return '<a target="_blank" href="' + getTransactionUrl(hash) + '">' + hash + '</a>';
}

// Format difficulty
function formatDifficulty(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Format luck / current effort
function formatLuck(difficulty, shares) {
    var percent = Math.round(shares / difficulty * 100);
    if(!percent){
        return '<span class="luckGood">?</span>';
    }
    else if(percent <= 100){
        return '<span class="luckGood">' + percent + '%</span>';
    }
    else if(percent >= 101 && percent <= 150){
        return '<span class="luckMid">' + percent + '%</span>';
    }
    else{
        return '<span class="luckBad">' + percent + '%</span>';
    }    
}

/**
 * URLs
 **/

// Return pool host
function getPoolHost() {
    if (typeof poolHost != "undefined") return poolHost;
    if (lastStats.config.poolHost) return lastStats.config.poolHost;
    else return window.location.hostname;
}

// Return transaction URL
function getTransactionUrl(id) {
    return transactionExplorer.replace(new RegExp('{symbol}', 'g'), lastStats.config.symbol.toLowerCase()).replace(new RegExp('{id}', 'g'), id);
}

// Return blockchain explorer URL
function getBlockchainUrl(id) {
    return blockchainExplorer.replace(new RegExp('{symbol}', 'g'), lastStats.config.symbol.toLowerCase()).replace(new RegExp('{id}', 'g'), id);    
}
 
/**
 * Tables
 **/
 
// Sort table cells
function sortTable() {
    var table = $(this).parents('table').eq(0),
        rows = table.find('tr:gt(0)').toArray().sort(compareTableRows($(this).index()));
    this.asc = !this.asc;
    if(!this.asc) {
        rows = rows.reverse()
    }
    for(var i = 0; i < rows.length; i++) {
        table.append(rows[i])
    }
}

// Compare table rows
function compareTableRows(index) {
    return function(a, b) {
        var valA = getCellValue(a, index), valB = getCellValue(b, index);
        if (!valA) { valA = 0; }
        if (!valB) { valB = 0; }
        return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.toString().localeCompare(valB.toString())
    }
}

// Get table cell value
function getCellValue(row, index) {
    return $(row).children('td').eq(index).data("sort")
}


/*
***************************************************************
pool_block methods
***************************************************************
*/

function poolBlocks_GenerateChart (data, displayedChart) {
	if (displayedChart[data.config.coin] || !data.charts.blocks || data.charts.blocks === "undefined" || !data.charts.blocksSolo || data.charts.blocksSolo === "undefined") return;
	let chartDays = data.config.blocksChartDays || null;
	let title = getTranslation('poolBlocks') ? getTranslation('poolBlocks') : 'Blocks found';
	if (chartDays) {
		if (chartDays === 1) title = getTranslation('blocksFoundLast24') ? getTranslation('blocksFoundLast24') : 'Blocks found in the last 24 hours';
		else title = getTranslation('blocksFoundLastDays') ? getTranslation('blocksFoundLastDays') : 'Blocks found in the last {DAYS} days';
		title = title.replace('{DAYS}', chartDays);
	}
	updateText(`blocksChartTitle${data.config.coin}`, title);
	let labels = [];
	let values = [];
	let valuesSolo = [];
	for (let key in data.charts.blocks) {
		let label = key;
		if (chartDays && chartDays === 1) {
			let keyParts = key.split(' ');
			label = keyParts[1].replace(':00', '');
		}
		labels.push(label);
		values.push(data.charts.blocks[key]);
	}
	for (let key in data.charts.blocksSolo) {
		valuesSolo.push(data.charts.blocksSolo[key]);
	}

	let $chart = $(`blocksChartObj${data.config.coin}`);
	let bgcolor = null,
		bordercolor = null,
		borderwidth = null;
	let colorelem = $chart.siblings('a.chart-style');
	if (colorelem.length == 1) {
		bgcolor = colorelem.css('background-color');
		bordercolor = colorelem.css('border-left-color');
		borderwidth = parseFloat(colorelem.css('width'));
	}
	if (bgcolor === null) bgcolor = 'rgba(3, 169, 244, .4)';
	if (bordercolor === null) bordercolor = '#03a9f4';
	if (borderwidth === null || isNaN(borderwidth)) borderwidth = 1;
	let chartElement = document.getElementById(`blocksChartObj${data.config.coin}`)
	if (!chartElement) return
	let chart = new Chart(chartElement, {
		type: 'bar',
		data: {
			labels: labels,
			datasets: [{
					label: 'Prop Blocks',
					data: values,
					fill: false,
					backgroundColor: bgcolor,
					borderColor: bordercolor,
					borderWidth: borderwidth
				},
				{
					label: 'Solo Blocks',
					data: valuesSolo,
					fill: false,
					backgroundColor: 'rgba(0, 230, 64, 1)',
					borderColor: bordercolor,
					borderWidth: borderwidth
				}
			]
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
			legend: {
				display: false
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						userCallback: function (label, index, labels) {
							if (Math.floor(label) === label) return label;
						}
					}
				}],
			},
			layout: {
				padding: {
					top: 0,
					left: 0,
					right: 0,
					bottom: 0
				}
			}
		}
	});
	$(`#blocksChart${data.config.coin}`)
		.show();
	displayedChart[data.config.coin] = true;
}

// Parse block data
function poolBlocks_ParseBlock (height, serializedBlock, stats) {
	var parts = serializedBlock.split(':');
	let block = {}
	if (parts[0].includes('solo') || parts[0].includes('prop')) {
		block = {
			height: parseInt(height),
			solo: parts[0] === 'solo',
			address: parts[1],
			hash: parts[2],
			time: parts[3],
			difficulty: parseInt(parts[4]),
			shares: parseInt(parts[5]),
			orphaned: parts[6],
			reward: parts[7]
		};
	} else {
		block = {
			height: parseInt(height),
			solo: false,
			address: '',
			hash: parts[0],
			time: parts[1],
			difficulty: parseInt(parts[2]),
			shares: parseInt(parts[3]),
			orphaned: parts[4],
			reward: parts[5]
		};
	}

	var toGo = stats.config.depth - (stats.network.height - block.height - 1);
	if (toGo > 1) {
		block.maturity = toGo + ' to go';
	} else if (toGo == 1) {
		block.maturity = "<i class='fa fa-spinner fa-spin'></i>";
	} else if (toGo <= 0) {
		block.maturity = "<i class='fa fa-unlock-alt'></i>";
	}

	switch (block.orphaned) {
		case '0':
			block.status = 'unlocked';
			block.maturity = "<i class='fa fa-unlock-alt'></i>";
			break;
		case '1':
			block.status = 'orphaned';
			block.maturity = "<i class='fa fa-times'></i>";
			block.reward = 0;
			break;
		default:
			block.status = 'pending';
			break;
	}
	return block;
}

// Get block row element
function getBlockRowElement (block, jsonString, stats) {
	function formatBlockLink (hash, stats) {
		return '<a target="_blank" href="' + getBlockchainUrl(hash, stats) + '">' + hash + '</a>';
	}

	var blockStatusClasses = {
		'pending': 'pending',
		'unlocked': 'unlocked',
		'orphaned': 'orphaned'
	};

	var row = document.createElement('tr');
	row.setAttribute(`data-json`, jsonString);
	row.setAttribute(`data-height`, block.height);
	row.setAttribute('id', `blockRow${stats.config.coin}${block.height}`);
	row.setAttribute('title', block.status);
	row.className = blockStatusClasses[block.status];

	var reward = "";
	if (typeof block.reward == "undefined") {
		reward = "Waiting...";
	} else {
		reward = getReadableCoins(stats, block.reward, null, true);
	}

	var columns =
		'<td class="col1">' + formatDate(block.time) + '</td>' +
		'<td class="col2">' + reward + '</td>' +
		'<td class="col3">' + block.height + '</td>' +
		'<td class="col4">' + block.difficulty + '</td>' +
		'<td class="col5">' + formatBlockLink(block.hash, stats) + '</td>' +
		'<td class="col5" title="Miners Address">' + block.address + '</td>' +
		'<td class="col6" align="right" title="' + block.shares + ' shares submitted">' + formatLuck(block.difficulty, block.shares, block.solo) + '</td>' +
		'<td class="col7">' + block.maturity + '</td>';

	row.innerHTML = columns;

	return row;
}

// Render blocks
function poolBlocks_RenderBlocks (blocksResults, stats) {
	var $blocksRows = $(`#blocksReport${stats.config.coin}_rows`);

	for (var i = 0; i < blocksResults.length; i += 2) {
		var block = poolBlocks_ParseBlock(blocksResults[i + 1], blocksResults[i], stats);
		var blockJson = JSON.stringify(block);

		var existingRow = document.getElementById(`blockRow${stats.config.coin}${block.height}`);
		if (existingRow && existingRow.getAttribute(`data-json`) !== blockJson) {
			$(existingRow)
				.replaceWith(getBlockRowElement(block, blockJson, stats));
		} else if (!existingRow) {
			var blockElement = getBlockRowElement(block, blockJson, stats);

			var inserted = false;
			var rows = $blocksRows.children()
				.get();
			for (var f = 0; f < rows.length; f++) {
				var bHeight = parseInt(rows[f].getAttribute(`data-height`));
				if (bHeight < block.height) {
					inserted = true;
					$(rows[f])
						.before(blockElement);
					break;
				}
			}
			if (!inserted) {
				$blocksRows.append(blockElement);
			}
		}
	}
}

// Load more blocks button
function poolBlocks_Setup (api, stats, xhrGetBlocks) {
	$(`#loadMoreBlocks${stats.config.coin}`)
		.click(function (xhrGetBlocks) {
			if (xhrGetBlocks[stats.config.coin]) xhrGetBlocks[stats.config.coin].abort();
			xhrGetBlocks[stats.config.coin] = $.ajax({
				url: api + '/get_blocks',
				data: {
					height: $(`#blocksReport${stats.config.coin}_rows`)
						.children()
						.last()
						.data(`height`)
				},
				dataType: 'json',
				cache: 'false',
				success: function (data) {
					poolBlocks_RenderBlocks(data, stats);
				}
			});
		});
}

function poolBlocks_InitTemplate (ranOnce, displayedChart, xhrGetBlocks) {
	let coin = lastStats.config.coin
	if ($(`#blocksTabs li:contains(${coin})`)
		.length == 0) {
		let template1 = $('#siblingTemplate')
			.html()
		Mustache.parse(template1)
		let rendered1 = Mustache.render(template1, {
			coin: lastStats.config.coin,
			active: 'active'
		})
		$('#tab-content')
			.append(rendered1)

		let template = $('#siblingTabTemplate')
			.html();
		Mustache.parse(template)
		let rendered = Mustache.render(template, {
			coin: lastStats.config.coin,
			symbol: `(${lastStats.config.symbol})`,
			active: 'active'
		});
		$('#blocksTabs')
			.append(rendered)

		poolBlocks_Setup(api, lastStats, xhrGetBlocks)
	}


	updateText(`blocksTotal${coin}`, lastStats.pool.totalBlocks.toString());
	if (lastStats.pool.lastBlockFound) {
		var d = new Date(parseInt(lastStats.pool.lastBlockFound))
			.toISOString();
		$(`#lastBlockFound${coin}`)
			.timeago('update', d);
	} else {
		$(`#lastBlockFound${coin}`)
			.removeAttr('title')
			.data('ts', '')
			.update('Never');
	}

	updateText(`blocksTotalSolo${coin}`, lastStats.pool.totalBlocksSolo.toString());
	if (lastStats.pool.lastBlockFoundSolo) {
		var d = new Date(parseInt(lastStats.pool.lastBlockFoundSolo))
			.toISOString();
		$(`#lastBlockFoundSolo${coin}`)
			.timeago('update', d);
	} else {
		$(`#lastBlockFoundSolo${coin}`)
			.removeAttr('title')
			.data('ts', '')
			.update('Never');
	}

	updateText(`blocksMaturityCount${coin}`, lastStats.config.depth.toString());

	$(`#averageLuck${coin}`)
		.html(formatLuck(lastStats.pool.totalDiff, lastStats.pool.totalShares));

	displayedChart[lastStats.config.coin] = false
	if (lastStats.charts.blocks) {
		poolBlocks_GenerateChart(lastStats, displayedChart);
	}

	poolBlocks_RenderBlocks(lastStats.pool.blocks, lastStats);


	Object.keys(mergedStats)
		.forEach(key => {
			if ($(`#blocksTabs li:contains(${key})`)
				.length == 0) {
				let template1 = $('#siblingTemplate')
					.html()
				Mustache.parse(template1)
				let rendered1 = Mustache.render(template1, {
					coin: key
				})
				$('#tab-content')
					.append(rendered1)

				let template = $('#siblingTabTemplate')
					.html();
				Mustache.parse(template)
				let rendered = Mustache.render(template, {
					coin: key,
					symbol: `(${mergedStats[key].config.symbol})`
				});
				$('#blocksTabs')
					.append(rendered)

				poolBlocks_Setup(mergedApis[key].api, mergedStats[key])
			}

			updateText(`blocksTotal${key}`, mergedStats[key].pool.totalBlocks.toString());
			if (mergedStats[key].pool.lastBlockFound) {
				var d = new Date(parseInt(mergedStats[key].pool.lastBlockFound))
					.toISOString();
				$(`#lastBlockFound${key}`)
					.timeago('update', d);
			} else {
				$(`#lastBlockFound${key}`)
					.removeAttr('title')
					.data('ts', '')
					.update('Never');
			}

			updateText(`blocksTotalSolo${key}`, mergedStats[key].pool.totalBlocksSolo.toString());
			if (mergedStats[key].pool.lastBlockFoundSolo) {
				var d = new Date(parseInt(mergedStats[key].pool.lastBlockFoundSolo))
					.toISOString();
				$(`#lastBlockFoundSolo${key}`)
					.timeago('update', d);
			} else {
				$(`#lastBlockFoundSolo${key}`)
					.removeAttr('title')
					.data('ts', '')
					.update('Never');
			}

			updateText(`blocksMaturityCount${key}`, mergedStats[key].config.depth.toString());

			$(`#averageLuck${key}`)
				.html(formatLuck(mergedStats[key].pool.totalDiff, mergedStats[key].pool.totalShares));
			displayedChart[key] = false
			if (mergedStats[key].charts.blocks) {
				poolBlocks_GenerateChart(mergedStats[key], displayedChart);
			}
			poolBlocks_RenderBlocks(mergedStats[key].pool.blocks, mergedStats[key]);
		})
	sortElementList($(`#blocksTabs`), $(`#blocksTabs>div`), mergedStats)
	if (!ranOnce)
		ranOnce = RunOnce()
}

/**
 * Translations
 **/

if (typeof langs == "undefined") {
    var langs = { en: 'English' };
}

if (typeof defaultLang == "undefined") {
    var defaultLang = 'en';
}

var langCode = defaultLang;
var langData = null; 

function getTranslation(key) {
    if (!langData || !langData[key]) return null;
    return langData[key];    
}

var translate = function(data) {
    langData = data;

    $("[tkey]").each(function(index) {
        var strTr = data[$(this).attr('tkey')];
        $(this).html(strTr);
    });

    $("[tplaceholder]").each(function(index) {
        var strTr = data[$(this).attr('tplaceholder')];
	$(this).attr('placeholder', strTr)
    });

    $("[tvalue]").each(function(index) {
        var strTr = data[$(this).attr('tvalue')];
        $(this).attr('value', strTr)
    });
} 

// Get language code from URL
const $_GET = {};
const args = location.search.substr(1).split(/&/);
for (var i=0; i<args.length; ++i) {
    const tmp = args[i].split(/=/);
    if (tmp[0] != "") {
        $_GET[decodeURIComponent(tmp[0])] = decodeURIComponent(tmp.slice(1).join("").replace("+", " "));
        var langCode = $_GET['lang'];    
    }
}

// Load language
function loadTranslations() {
    if (langData) {
        translate(langData);
    }
    else if (langs && langs[langCode]) {
        $.getJSON('lang/'+langCode+'.json', translate);
        $.getScript('lang/timeago/jquery.timeago.'+langCode+'.js');    
    } else {
        $.getJSON('lang/'+defaultLang+'.json', translate);
        $.getScript('lang/timeago/jquery.timeago.'+defaultLang+'.js');    
    }
}

// Language selector
function renderLangSelector() {
    // Desktop
    var html = '';
    var numLangs = 0;
    if (langs) {
        html += '<select id="newLang" class="form-control form-control-sm">';
        for (var lang in langs) {
            var selected = lang == langCode ? ' selected="selected"' : '';
            html += '<option value="' + lang + '"' + selected + '>' + langs[lang] + '</option>';
	    numLangs ++;
        }
	html += '</select>';
    }
    if (html && numLangs > 1) {
        $('#langSelector').html(html);	
        $('#newLang').each(function(){
            $(this).change(function() {
                var newLang = $(this).val();
                var url = '?lang=' + newLang;
                if (window.location.hash) url += window.location.hash;
                window.location.href = url;
            });
        });
    }	

    // Mobile
    var html = '';
    var numLangs = 0;
    if (langs) {
        html += '<select id="mNewLang" class="form-control form-control-sm">';
        for (var lang in langs) {
            var selected = lang == langCode ? ' selected="selected"' : '';
            html += '<option value="' + lang + '"' + selected + '>' + langs[lang] + '</option>';
	    numLangs ++;
        }
	html += '</select>';
    }
    if (html && numLangs > 1) {
        $('#mLangSelector').html(html);	
        $('#mNewLang').each(function(){
            $(this).change(function() {
                var newLang = $(this).val();
                var url = '?lang=' + newLang;
                if (window.location.hash) url += window.location.hash;
                window.location.href = url;
            });
        });
    }	
}
