/* eslint-disable no-extend-native */
/* eslint-disable camelcase */
var $FRONTEND = (function (module) {
    var _p = module._p = module._p || {}
    // 초기화면 세팅

    var estimator_type
    var model_info
    var interval
    var scores = []
    var labels = []

    _p.init = function () {
        model_info ={}
        _p.playInterval()
        _p.getStatus()
        // _p.drawScoreTrend([])
        $('#stopButton').attr('disabled', true)

        $('#learderboard_table').on('load-success.bs.table', function (data, jqXHR) {
            $(jqXHR.results).each(function(index, value) {
                model_info[value.pk] = value.evaluationStat
            })
        })
    }

    _p.playInterval = function () {
        interval = setInterval(function () { _p.getProgress() }, 2000)
        // return false
    }

    // Progress bar 관련
    _p.getStatus = function () {
        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + 'runtime/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.error_msg == null) {
                    if (resultData.status === "learning") {
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

                    estimator_type = resultData.estimatorType
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
            url: g_RESTAPI_HOST_BASE + 'runtime/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.error_msg) {
                    clearInterval(interval)
                    console.log('stopped', resultData.error_msg)
                } else {
                    if (resultData.status !== "learning") {
                        $('#leaderboard_loader').removeClass('loader')
                        clearInterval(interval)
                    }
                    percent = Math.round(resultData.doneSlot / resultData.totalSlot * 100) + '%'
                    $('#percent').text(percent)
                    $('#progress_bar').css('width', percent)

                    var s = parseInt(resultData.doneSlot)
                    var h = Math.floor(s / 3600) // Get whole hours
                    s -= h * 3600
                    var m = Math.floor(s / 60) // Get remaining minutes
                    s -= m * 60
                    elapsed = h + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s)
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
            url: g_RESTAPI_HOST_BASE + 'runtime/score_trend/',
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
            url: g_RESTAPI_HOST_BASE + 'runtime/stop/',
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.err_msg == null) {
                    $('#leaderboard_loader').removeClass('loader')
                    $('#stopButton').attr('disabled', true)

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
        str += '<a href="#none" class="tooltip_model"><span class="ico_automl ico_info">자세히보기</span><div class="txt_tooltip">알고리즘 설명</div></a>'
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

    _p.informationFormatter = function (value, row) {
        return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-information" onclick="$FRONTEND._p.setInformationModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, row.typ)
    }

    _p.explanationFormatter = function (value, row) {
        if (row.tryLimeHtml) {
            return '<button class="btn_s btn_border" data-toggle="modal" data-target="#modal-explanation" onclick="$FRONTEND._p.setExplanationModal(\'{0}\',\'{1}\')" type="button" >View</button>'.format(value, row.typ)
        } else {
            return '<button class="btn_s btn_border" disabled>-</button>';
        }
    }

    _p.deployFormatter = function (value, row) {
        if (row.deployed) {
            return '<button id ="deploy' + value + '" class="btn_deploy" type="button" disabled><span class="ico_automl ico_check">Deploy</span></button>'.format(value, row.typ)
        }
        return '<button id ="deploy' + value + '" class="btn_deploy" type="button" onclick="$FRONTEND._p.deployModel(\'{0}\',\'{1}\')"><span class="ico_automl ico_arr">Deploy</span></button>'.format(value, row.typ)
    }

    _p.deployModel = function (model_pk, model_type) {
        var data = {}
        data.model_pk = model_pk
        data.model_type = model_type

        $('.ico_check').toggleClass('ico_check', 'ico_arr')
        $('#deploy' + model_pk + 'span').toggleClass('ico_arr', 'ico_check') // .html('<span class="ico_automl ico_check">Deploy</span>')
        $('.btn_deploy').attr('disabled', true)

        $('#modal-deploy').modal('show')
        $('#modal-deploy #modal-deploy-loading').show()
        $('#modal-deploy #modal-deploy-done').hide()
        $('#modal-deploy #modal-deploy-error').hide()

        return $.ajax({
            type: 'post',
            url: g_RESTAPI_HOST_BASE + 'deployment/',
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                if (resultData.err_msg) {
                    $('#modal-deploy #modal-deploy-loading').hide()
                    $('#modal-deploy #modal-deploy-done').hide()
                    $('#modal-deploy #modal-deploy-error').show()
                } else {
                    $('#modal-deploy #modal-deploy-loading').hide()
                    $('#modal-deploy #modal-deploy-done').show()
                    $('#modal-deploy #modal-deploy-error').hide()
                    window.location.replace('/deploy')
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
    _p.setInformationModal = function (model_pk, model_type) {
        $('#modal-information #modal-information-loading').show()
        $('#modal-information #modal-information-done').hide()
        $('#modal-information #modal-information-error').hide()
        if (estimator_type === 'classifier') {
            $('.regression-info').hide()
            $('.classification-info').show()
        }else{
            $('.classification-info').hide()
            $('.regression-info').show()
        }
        if(model_info[model_pk] !== null){
            _p.drawFeature(model_info[model_pk].featureImportancesJson)
            _p.drawRoc(model_info[model_pk].rocCurveJson)
            _p.drawMatrix(model_info[model_pk].confusionMatrixJson)
            _p.drawBalance(model_info[model_pk].classBalanceJson)
            $('#modal-information #modal-information-loading').hide()
            $('#modal-information #modal-information-done').show()
        }else{
            model_type = model_type+'s'
            return $.ajax({
                type: 'get',
                url: g_RESTAPI_HOST_BASE + '{0}/{1}/stats/'.format(model_type, model_pk),
                dataType: 'json',
                success: function (resultData, textStatus, request) {
                    if (resultData.error_msg == null) {
                        $('#modal-information #modal-information-loading').hide()
                        $('#modal-information #modal-information-done').show()
                        _p.drawFeature(resultData.featureImportancesJson)
                        if (estimator_type === 'classifier') {
                            _p.drawRoc(resultData.rocCurveJson)
                            _p.drawMatrix(resultData.confusionMatrixJson)
                            _p.drawBalance(resultData.classBalanceJson)
                        } else {
                            _p.drawResiduals(resultData.predErrorJson)
                        }
                    } else {
                        $('#modal-information #modal-information-loading').hide()
                        $('#modal-information #modal-information-done').hide()
                        $('#modal-information #modal-information-error').show()
                    }
                },
                error: function (res) {
                    $('#modal-information #modal-information-loading').hide()
                    $('#modal-information #modal-information-done').hide()
                    $('#modal-information #modal-information-error').show()
                    alert(res.responseJSON.message)
                }
            })
        }





    }

    _p.setExplanationModal = function (model_pk, model_type) {

        var data = {}
        model_type = model_type + 's'

        $('#modal-explanation #modal-explanation-loading').show()
        $('#modal-explanation #modal-explanation-done').hide()
        $('#modal-explanation #modal-explanation-error').hide()

        return $.ajax({
            type: 'get',
            url: g_RESTAPI_HOST_BASE + '{0}/{1}/explanation/'.format(model_type, model_pk),
            data: data,
            dataType: 'json',
            success: function (resultData, textStatus, request) {
                $('#modal-explanation #modal-explanation-loading').hide()
                if (resultData.error_msg) {
                    $('#modal-explanation #modal-explanation-error').show()
                    console.log(resultData.error_msg)
                } else {
                    $('#modal-explanation #modal-explanation-done').show()
                    $('#modal-explanation #modal-explanation-done iframe').attr('srcdoc', resultData.limeHtml)
                }
            },
            error: function (res) {
                $('#modal-explanation #modal-explanation-loading').hide()
                $('#modal-explanation #modal-explanation-error').show()
                alert(res.responseJSON.message)
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
