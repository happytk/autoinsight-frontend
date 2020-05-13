/* eslint-disable no-extend-native */
/* eslint-disable camelcase */
var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {}
    // 초기화면 세팅

    var interval
    var scores = []
    var labels = []

    _p.init = function () {
        _p.playInterval()
        _p.getStatus()
        $('#stopButton').attr('disabled', true)

    }

    _p.playInterval = function () {
        status ="learning"
        interval = setInterval(function () { _p.getProgress() }, 2000)
        // return false
    }

    // Progress bar 관련
    _p.getStatus = function () {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE +'runtimes/'+runtime_id + '/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.error_msg == null) {
                    if (resultData.status === "learning" || resultData.status === "preprocessing") {
                        $('#leaderboard_loader').addClass('loader')
                        $('#stopButton').attr('disabled', false)
                    }

                    var s = parseInt(resultData.timeout)
                    var h = Math.floor(s / 3600) // Get whole hours
                    s -= h * 3600
                    var m = Math.floor(s / 60) // Get remaining minutes
                    s -= m * 60
                    var timeout = h + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
                    $('#timeout').text(timeout)
                } else {
                    console.log(resultData.error_msg)
                }
            },
            error: function (res) {
                alert(res.responseJSON.message)
            }
        })
    }

    _p.getProgress = function () {
        var percent
        var elapsed
        $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+runtime_id + '/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.error_msg) {
                    clearInterval(interval)
                    $('#runButton').prop('disabled', true);
                    $('#runButton').html('Error')
                    console.log('stopped', resultData.error_msg)
                } else {
                    if(resultData.status === "finished"){
                        clearInterval(interval)
                        $('#leaderboard_loader').removeClass('loader')
                        $('#runButton').prop('disabled', true);
                        $('#runButton').html('Finished')
                    }
                    else if(resultData.status === "error"){
                        $('#runButton').prop('disabled', true);
                        $('#runButton').html('Error')
                    }
                    else if(resultData.status === "preprocessing"){
                        $('#preprocess_loader').addClass("loader")
                        $('#runButton').prop('disabled', true);
                        $('#runButton').html('Preprocessing')
                    }else{
                        $('#runButton').prop('disabled', true);
                        $('#runButton').html('Learning')
                    }
                    percent = Math.round(resultData.doneSlot / resultData.timeout * 100) + '%'
                    var s = parseInt(resultData.doneSlot)
                    var h = Math.floor(s / 3600) // Get whole hours
                    s -= h * 3600
                    var m = Math.floor(s / 60) // Get remaining minutes
                    s -= m * 60
                    elapsed = h + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
                    if(resultData.status === "preprocessing") elapsed = "Preprocessing"

                    $('#percent').text(percent)
                    $('#progress_bar').css('width', percent)


                    $('#elapsed').text(elapsed)

                    $('#learderboard_table').bootstrapTable('refresh', { silent: true })

                }
            },
            error: function (res) {
                alert(res.responseJSON.message)
            }
        })
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+ runtime_id + '/score_trend/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.err_msg == null && resultData.length !== 0) {

                    if(scores.length===0){
                        $(resultData.slice(-20)).each(function(index, data) {
                            labels.push(data.createdAt)
                            scores.push(data.score)
                        })
                        _p.drawScoreTrend(scores, labels)
                    }else{
                        if (_p.myLineChart.data.labels.length === 20) {
                            _p.myLineChart.data.labels.shift()
                            _p.myLineChart.data.datasets.forEach((dataset) => {
                                dataset.data.shift()
                            })
                        }
                        _p.myLineChart.data.labels.push(resultData[resultData.length-1].createdAt)
                        _p.myLineChart.data.datasets.forEach((dataset) => {
                            dataset.data.push(resultData[resultData.length-1].score)
                        })
                        _p.myLineChart.update()
                    }
                } else {
                    return false
                }
            },
            error: function (res) {
                alert(res.responseJSON.message)
            }
        })
    }

    _p.stopAutoml = function () {
        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+ runtime_id + '/stop/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.err_msg == null) {
                    $('#leaderboard_loader').removeClass('loader')
                    $('#stopButton').attr('disabled', true)
                    $('#runButton').prop('disabled', true);
                    $('#runButton').html('Finished')
                    alert("AutoML 구동을 종료합니다.")
                } else {
                    alert(resultData.err_msg)
                }
            },
            error: function (res) {
                alert(res.responseJSON.message)
            }
        })
    }

    // Table관련
    _p.modelFormatter = function (value, row) {
        var str = ''
        if (row.typ === 'ensemble') {
            str += '<span class="badge_model">Ensembles</span>'
            str += value[0]
        }else{
            str += value
        }
        // str += '<a href="#none" class="tooltip_model"><span class="ico_automl ico_info">자세히보기</span><div class="txt_tooltip">알고리즘 설명</div></a>'
        if (row.addition > 0) {
            str += '<a href="#none" class="tooltip_model"><span class="num_info">+' + row.addition + '</span><div class="txt_tooltip"> ' + value.slice(1,value.length) + '</div></a>'
        }
        return str
    }

    String.prototype.format = function () {
        var a = this
        var k

        for (k in arguments) {
            a = a.replace('{' + k + '}', arguments[k])
        }
        return a
    }

    _p.statsFormatter = function (value, row) {
        if(row.evaluationStatStatus =="INIT"){
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-stats" onclick="$FRONTEND._p.setStatsModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, 'post')
        }else if(row.evaluationStatStatus =="PROCESSING"){
            return '<button class="btn_s btn_border" disabled>Processing</button>';
        }else if(row.evaluationStatStatus =="DONE"){
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-stats" onclick="$FRONTEND._p.setStatsModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, 'get')
        }else{
            return '<button class="btn_s btn_border" disabled>Error</button>';
        }
    }

    _p.explanationFormatter = function (value, row) {
        if(row.limeHtmlStatus =="INIT"){
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-explanation" onclick="$FRONTEND._p.setExplanationModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, 'post')
        }else if(row.limeHtmlStatus =="PROCESSING"){
            return '<button class="btn_s btn_border" disabled>Processing</button>';
        }else if(row.limeHtmlStatus =="DONE"){
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-explanation" onclick="$FRONTEND._p.setExplanationModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, 'get')
        }else{
            return '<a class="tooltip_model"><span class="ico_automl ico_info">자세히보기</span><div class="txt_tooltip">This model cannot load explantion</div></a>';
        }
    }

    _p.infoFormatter = function (value, row) {
        if(row.allMetricsStatus =="INIT"){
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-info" onclick="$FRONTEND._p.setInfoModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, 'post')
        }else if(row.allMetricsStatus =="PROCESSING"){
            return '<button class="btn_s btn_border" disabled>Processing</button>';
        }else if(row.allMetricsStatus =="DONE"){
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-info" onclick="$FRONTEND._p.setInfoModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, 'get')
        }else{
            return '<button class="btn_s btn_border" disabled>Error</button>';
        }
    }

    _p.deployFormatter = function (value, row) {
        if (row.deployed) {
            return '<button id ="deploy' + value + '" class="btn_deploy" type="button" disabled><span class="ico_automl ico_check">Deploy</span></button>'
        }
        return '<button id ="deploy' + value + '" class="btn_deploy tooltip_model" type="button" onclick="$FRONTEND._p.deployModel(\'{0}\',\'{1}\')"><span class="ico_automl ico_arr">Deploy</span><div class="txt_tooltip">Click to deploy</div></button>'.format(value, 'post')
    }

    _p.deployModel = function (model_pk, method) {
        var data = {}
        if(method==='post'){
            data.modelPk = model_pk
            $('.ico_check').toggleClass('ico_check', 'ico_arr')
            $('#deploy' + model_pk + 'span').toggleClass('ico_arr', 'ico_check') // .html('<span class="ico_automl ico_check">Deploy</span>')
            $('.btn_deploy').attr('disabled', true)

            $('#modal-deploy').modal('show')
            $('#modal-deploy #modal-deploy-loading').show()
            $('#modal-deploy #modal-deploy-done').hide()
            $('#modal-deploy #modal-deploy-error').hide()
        }
        return $.ajax({
            type: method,
            url: g_RESTAPI_HOST_BASE + 'runtimes/'+ runtime_id + '/deployment/',
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if(resultData.status==="INIT" || resultData.status==="REQUEST" || resultData.status==="DEPLOYING"){
                    _p.deployModel(model_pk, 'get')
                    return false
                }
                else if(resultData.status==="ERROR"){
                    $('#modal-deploy #modal-deploy-loading').hide()
                    $('#modal-deploy #modal-deploy-done').hide()
                    $('#modal-deploy #modal-deploy-error').show()

                } else {
                    $('#modal-deploy #modal-deploy-loading').hide()
                    $('#modal-deploy #modal-deploy-done').show()
                    $('#modal-deploy #modal-deploy-error').hide()
                    window.location.replace('/deploy/'+runtime_id+"/")
                }
            },
            error: function (res) {
                $('#modal-deploy #modal-deploy-loading').hide()
                $('#modal-deploy #modal-deploy-done').hide()
                $('#modal-deploy #modal-deploy-error').show()
            }
        })
    }


    // Modal 관련
    _p.setStatsModal = function (model_pk, method) {
        if(method==='post') {
            $('#modal-stats #modal-stats-loading').show()
            $('#modal-stats #modal-stats-done').hide()
            $('#modal-stats #modal-stats-error').hide()
        }

        return $.ajax({
            type: method,
            url: g_RESTAPI_HOST_BASE + 'runtimes/{0}/models/{1}/stats/'.format(runtime_id, model_pk),
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if(resultData.status==="REQUEST" || resultData.status==="PROCESSING"){
                    setTimeout(function(){
                        _p.setStatsModal(model_pk, 'get');
                        if(status ==="finished") $('#learderboard_table').bootstrapTable('refresh', { silent: true })
                    }, 1000)
                    return false
                }else if(resultData.status ==="ERROR"){
                    $('#modal-stats #modal-stats-loading').hide()
                    $('#modal-stats #modal-stats-done').hide()
                    $('#modal-stats #modal-stats-error').show()
                }else {
                    $('#modal-stats #modal-stats-loading').hide()
                    $('#modal-stats #modal-stats-error').hide()
                    $('#modal-stats #modal-stats-done').show()
                    if(resultData.featureImportancesJson !== null){
                        _p.drawFeature(resultData.featureImportancesJson)
                        $('#featureChart_tab').show()
                    }
                    if(resultData.rocCurveJson !== null){
                        _p.drawRoc(resultData.rocCurveJson)
                        $('#rocChart_tab').show()
                    }
                    if(resultData.confusionMatrixJson !== null){
                        _p.drawMatrix(resultData.confusionMatrixJson)
                        $('#conf_matrix_tab').show()
                    }
                    if(resultData.classBalanceJson !== null){
                        _p.drawBalance(resultData.classBalanceJson)
                        $('#balanceChart_tab').show()
                    }
                    if(resultData.predErrorJson !== null){
                        _p.drawResiduals(resultData.predErrorJson)
                        $('#residualsChart_tab').show()
                    }
                }

            },
            error: function (res) {
                $('#modal-stats #modal-stats-loading').hide()
                $('#modal-stats #modal-stats-done').hide()
                $('#modal-stats #modal-stats-error').show()
                alert(res.responseJSON.message)
            }
        })
    }

    _p.setExplanationModal = function (model_pk, method) {

        var data = {}
        if(method==='post') {
            $('#modal-explanation #modal-explanation-loading').show()
            $('#modal-explanation #modal-explanation-done').hide()
            $('#modal-explanation #modal-explanation-error').hide()
        }

        return $.ajax({
            type: method,
            url: g_RESTAPI_HOST_BASE + 'runtimes/{0}/models/{1}/explanation/'.format(runtime_id, model_pk),
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if(resultData.status==="REQUEST" || resultData.status==="PROCESSING"){
                    setTimeout(function(){
                        _p.setExplanationModal(model_pk, 'get')
                        if(status ==="finished") $('#learderboard_table').bootstrapTable('refresh', { silent: true })
                    }, 1000)
                    return false
                }else if(resultData.status ==="ERROR"){
                    $('#modal-explanation #modal-explanation-loading').hide()
                    $('#modal-explanation #modal-explanation-error').show()
                }else {
                    $('#modal-explanation #modal-explanation-loading').hide()
                    $('#modal-explanation #modal-explanation-error').hide()
                    $('#modal-explanation #modal-explanation-done').show()
                    $('#modal-explanation #modal-explanation-done iframe').attr('srcdoc', resultData.limeHtml)
                }
            },
            error: function (res) {
                $('#modal-explanation #modal-explanation-loading').hide()
                $('#modal-explanation #modal-explanation-error').show()
            }
        })
    }

    _p.setInfoModal = function (model_pk, method) {
        $('#metric_tab').attr("onclick", "$FRONTEND._p.loadMetrics(\'{0}\',\'{1}\')".format(model_pk,method));
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'runtimes/{0}/models/{1}/pipeline_info/'.format(runtime_id, model_pk),
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if(resultData.status ==="ERROR"){
                    $('#modal-info #modal-info-loading').hide()
                    $('#modal-info #modal-info-done').hide()
                    $('#modal-info #modal-info-error').show()
                }else {
                    $('#modal-info #modal-info-loading').hide()
                    $('#modal-info #modal-info-error').hide()
                    var tablehtml = ""
                    $.each( resultData.namedSteps, function( key, value ) {
                        tablehtml += '<tr><td class="txt_l">'+key+'</td><td class="txt_l">'+value+'</td></tr>'
                    })
                    $('#pipeline_tbody').html(tablehtml)
                    $('#modal-info #modal-info-done').show()
                }

            },
            error: function (res) {
                $('#modal-info #modal-info-loading').hide()
                $('#modal-info #modal-info-done').hide()
                $('#modal-info #modal-info-error').show()
                console.log(res)
            }
        })


    }

    _p.loadMetrics = function (model_pk, method) {
        if(method==='post') {
            $('#modal-info #modal-info-loading').show()
            $('#modal-info #modal-info-done').hide()
            $('#modal-info #modal-info-error').hide()
        }
        return $.ajax({
            type: method,
            url: g_RESTAPI_HOST_BASE + 'runtimes/{0}/models/{1}/metrics/'.format(runtime_id, model_pk),
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if(resultData.status==="REQUEST" || resultData.status==="PROCESSING"){
                    setTimeout(function(){
                        _p.loadMetrics(model_pk, 'get');
                        if(status ==="finished") $('#learderboard_table').bootstrapTable('refresh', { silent: true })
                    }, 1000)
                    return false
                }else if(resultData.status ==="ERROR"){
                    $('#modal-info #modal-info-loading').hide()
                    $('#modal-info #modal-info-done').hide()
                    $('#modal-info #modal-info-error').show()
                }else {
                    $('#modal-info #modal-info-loading').hide()
                    $('#modal-info #modal-info-error').hide()

                    var tablehtml = ""
                    $.each(resultData.allMetricsJson, function( key, value ) {
                        tablehtml += '<tr><td class="txt_l">'+key+'</td><td class="txt_l">'+value+'</td></tr>'
                    })
                    $('#metric_tbody').html(tablehtml)
                    $('#modal-info #modal-info-done').show()
                }

            },
            error: function (res) {
                $('#modal-info #modal-info-loading').hide()
                $('#modal-info #modal-info-done').hide()
                $('#modal-info #modal-info-error').show()
                console.log(res)
            }
        })
    }


    // 차트관련
    _p.drawScoreTrend = function (data, labels) {
        if(data === null) return false
        // eslint-disable-next-line no-undef
        _p.myLineChart = new Chart($('#score_trend'), {
            type: 'line',
            data: {
                labels: labels, // ["January","February","March","April","May","June","July"],
                datasets: [{
                    data: data,
                    fill: false,
                    borderColor: 'rgb(75, 192, 192)',
                    lineTension: 0.1
                }]
            },
            options: {
                animation: {
                    duration: 0
                },
                responsive: true,
                legend: {
                    display: false
                },
                title: {
                    display: false
                },
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    xAxes: [{
                        scaleLabel: {
                            display: false
                        },
                        gridLines: {
                            display: false
                        },
                        ticks: {
                            display: false,
                            beginAtZero: true
                        }
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: false
                        },
                        gridLines: {
                            display: true,
                            drawBorder: false
                        },
                        ticks: {
                            display: false,
                            beginAtZero: true
                        }
                    }]
                }
            }
        })
    }

    _p.drawFeature = function (data) {
        if(data === null) return false
        // eslint-disable-next-line no-undef
        Highcharts.chart('featureChart', {
            chart: {
                type: 'bar',
                plotBorderWidth: 1,
                plotBorderColor: '#111111'
            },
            title: {
                text: 'Feature Importance'
            },
            credits: {
                enabled: false
            },
            defs: {
                patterns: [{
                    id: 'custom-pattern',
                    path: {
                        d: 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11',
                        stroke: '#ba7bcc',
                        strokeWidth: 3,
                        fill: '#a658be'
                    }
                }]
            },
            exporting: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            xAxis: {
                lineWidth: 0,
                title: {
                    enabled: false
                },
                labels: {
                    x: -20
                },
                tickWidth: 1,
                tickColor: '#111111',
                tickLength: 10,
                offset: -5,
                categories: data[0]// ['EXE SOURCE_2', 'EXE SOURCE_3', 'EXE SOURCE_1', 'DAYS_BIRTH', 'SK_ID_CUPR', 'DAYS_ID_PUBLISH', 'YS_LAST_PHONE_CHANGE', 'DAYS_EMPLOYED', 'AMT_ANNUITY', 'AMT_INCOME_TOTAL', 'N_POPULATION_RELATIVE']

            },
            yAxis: [{
                title: {
                    enabled: true,
                    text: 'Normalized Importance'
                },
                lineWidth: 0,
                tickColor: '#111111',
                tickWidth: 1,
                tickLength: 10,
                showFirstLabel: false,
                showLastLabel: false,
                labels: {
                    y: 30
                }
                // tickPositions: [-0.002, 0.02, 0.04, 0.06, 0.08, 0.102]
            }
            ],
            plotOptions: {
                series: {
                    stacking: 'normal',
                    animation: false,
                    pointWidth: 10
                },
                bar: {
                    grouping: false,
                    dataLabels: {
                        enabled: false
                    }
                }
            },
            series: [

                {
                    // 실제 data
                    name: 'Values',
                    data: data[1], // [0.1, 0.09, 0.07, 0.05, 0.02, 0.09, 0.07, 0.05, 0.02, 0.02, 0.02],
                    borderRadius: 5,
                    color: 'url(#custom-pattern)'
                }]
        })
    }

    _p.drawRoc = function (data) {
        if(data === null) return false
        var datasets = [{
            label: 'random',
            data: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
            borderColor: 'rgb(70, 70, 70)',
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            showLine: true
        }]
        var colors = ['rgb(167, 89, 190)', 'rgb(75, 192, 192)', 'rgb(245, 74, 74)']
        for (var i = 0; i < data.length; i++) {
            var tmp = []
            data[i][1].forEach(function (point) {
                tmp.push({
                    x: point.fpr,
                    y: point.tpr
                })
            })
            datasets.push({
                label: 'roc curve' + (i + 1),
                steppedLine: 'after',
                data: tmp,
                borderColor: colors[i % 3],
                borderWidth: 3,
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
                tension: 0,
                showLine: true
            })
        }

        // eslint-disable-next-line no-new
        new Chart($('#rocChart'), {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'ROC Curve',
                    fontSize: 18,
                    fontColor: '#111',
                    fontStyle: 'normal',
                    fontFamily: " 'Lucida Grande', 'Lucida Sans Unicode', 'Arial', 'Helvetica', 'sans-serif'"
                },
                legend: {
                    position: 'bottom'
                },
                scales: {
                    xAxes: [{
                        gridLines: {
                            color: '#e6e6e6',
                            lineWidth: 1,
                            zeroLineColor: '#111'
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            color: '#e6e6e6',
                            lineWidth: 1,
                            zeroLineColor: '#111'
                        }
                    }]
                }
            }
        })
    }

    _p.drawMatrix = function (data) {
        if(data === null) return false
        var targets = []
        var i
        var j
        var tmp = []
        var max = 0

        for (i = 0; i < data.length; i++) {
            targets.push(i)
        }
        for (i = 0; i < data.length; i++) {
            for (j = 0; j < data[i].length; j++) {
                tmp.push([i, j, data[i][j]])
                if (max < data[i][j]) max = data[i][j]
            }
        }

        // eslint-disable-next-line no-undef
        Highcharts.chart({
            chart: {
                renderTo: 'conf_matrix',
                type: 'heatmap',
                marginTop: 40,
                marginBottom: 80,
                marginRight: 110
            },

            title: {
                text: null
            },

            exporting: {
                enabled: false
            },

            xAxis: {
                lineWidth: 0,
                categories: targets// ['Alexander', 'Marie', 'Maximilian', 'Sophia', 'Lukas', 'Maria', 'Leon', 'Anna', 'Tim', 'Laura']
            },

            yAxis: {
                lineWidth: 0,
                categories: targets, // ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                title: null,
                reversed: true
            },

            colorAxis: {
                stops: [
                    [0, '#a55bc0'], // 최저값 컬러
                    // [0.5, '#fff'], // 가운데값 컬러
                    [0.9, '#3babaf'] // 최고값 컬러
                ],
                min: 0.1,
                max: max,
                reversed: false
            },

            legend: {
                align: 'right',
                layout: 'vertical',
                margin: 0,
                verticalAlign: 'top',
                y: 23, // legend Y position
                symbolHeight: 280,
                reversed: true

            },

            tooltip: {
                formatter: function () {
                    return '<b>' + this.series.xAxis.categories[this.point.x] +
                        this.point.value + '</b> on <br><b>' + this.series.yAxis.categories[this.point.y] + '</b>'
                }
            },

            series: [{
                name: 'Sales per employee',
                borderWidth: 0,
                data: tmp, // [[0, 0, 0], [0, 1, 0.99], [0, 2, 0.97], [0, 3, 0.7], [1, 0, 0.92], [1, 1, 0.58], [1, 2, 0.78], [1, 3, 0.58], [2, 0, 0.35], [2, 1, 0.15], [2, 2, 0.65], [2, 3, 0.15]],
                dataLabels: {
                    enabled: true,
                    color: '#ffffff',
                    style: {
                        textOutline: false,
                        fontWeight: '400'
                    }
                }
            }]

        })
    }

    _p.drawBalance = function (data) {
        if(data === null) return false
        var tmp = []
        for (var i = 0; i < data[1].length; i++) {
            tmp.push({
                y: data[1][i],
                color: 'url(#balance-pattern' + i % 3 + ')'
            })
        }
        // eslint-disable-next-line no-undef
        Highcharts.chart('balanceChart', {
            chart: {
                type: 'column',
                marginTop: 50
            },
            title: {
                text: null
            },
            credits: {
                enabled: false
            },
            exporting: {
                enabled: false
            },
            legend: {
                enabled: false
            },
            defs: {
                patterns: [{
                    id: 'balance-pattern0',
                    path: {
                        d: 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11',
                        stroke: '#ba7bcc',
                        strokeWidth: 3,
                        fill: '#a658be'
                    }
                },
                    {
                        id: 'balance-pattern1',
                        path: {
                            d: 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11',
                            stroke: '#53b5b9',
                            strokeWidth: 3,
                            fill: '#3fadb1'
                        }
                    },
                    {
                        id: 'balance-pattern2',
                        path: {
                            d: 'M 0 0 L 10 10 M 9 -1 L 11 1 M -1 9 L 1 11',
                            stroke: '#f54a4a',
                            strokeWidth: 3,
                            fill: '#f43536'
                        }
                    }
                ]
            },
            series: [{
                name: null,
                data: tmp
            }],
            plotOptions: {
                series: {
                    groupPadding: 0.01,
                    colorByPoint: true
                }
            },
            xAxis: [{
                lineColor: '#111111',
                tickWidth: 0,
                categories: data[0]// ['0.0', '1.0', '2.0']
            }],
            yAxis: [{
                title: {
                    enabled: false
                }
            }]
        })
    }

    _p.drawResiduals = function (data) {
        if(data === null) return false
        var datasets = [{
            data: [{ x: Math.min.apply(null, data.prediction) - 1, y: 0 }, { x: Math.max.apply(null, data.prediction) + 1, y: 0 }],
            borderColor: 'rgb(30, 30, 30)',
            borderWidth: 3,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
            tension: 0,
            showLine: true,
            label: '0'
        }]

        var tmp = []
        for (var i = 0; i < data.length; i++) {
            tmp.push({
                x: data[i].prediction,
                y: data[i].residuals
            })
        }

        datasets.push({
            label: 'Residuals',
            data: tmp
        })

        // eslint-disable-next-line no-new
        new Chart($('#residualsChart'), {
            type: 'scatter',
            data: {
                datasets: datasets
            },
            options: {
                scales: {
                    xAxes: [{
                        type: 'linear',
                        position: 'bottom',
                        labelString: 'Predicted Values'
                    }],
                    yAxes: [{
                        labelString: 'Residuals'
                    }]
                }
            }
        })
    }

    return module
// eslint-disable-next-line no-use-before-define
}($FRONTEND || {}))
