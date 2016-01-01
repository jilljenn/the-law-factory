'use strict';

// Useful functions
var accentMap = {
    "á": "a",
    "à": "a",
    "â": "a",
    "é": "e",
    "è": "e",
    "ê": "e",
    "ë": "e",
    "ç": "c",
    "î": "i",
    "ï": "i",
    "ô": "o",
    "ö": "o",
    "ù": "u",
    "Û": "u",
    "ü": "u"
}, clean_accents = function (term) {
    var ret = "";
    for (var i = 0; i < term.length; i++) {
        ret += accentMap[term.charAt(i)] || term.charAt(i);
    }
    return ret;
}, opacity_amdts = function (d) {
    if (d > 1000) d = 1000;
    return 0.05 + 0.75 * d / 1000;
}, opacity_mots = function (d) {
    if (d > 100000) d = 100000;
    return 0.05 + 0.75 * d / 100000;
}, upperFirst = function (s) {
    return (!s ? "" : s.charAt(0).toUpperCase() + s.substring(1));
};

/* Directives */

angular.module('theLawFactory.directives', []).directive('mod1', ['api', '$rootScope', '$location', '$compile',
    function (api, $rootScope) {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: 'templates/mod1.html',
            controller: function ($scope) {
                $scope.mod = "mod1";
                $scope.setHelpText("Chaque boîte représente un article dont la taille indique la longueur du texte et la couleur le degré de modifications à cette étape. Cliquez sur un article pour lire le texte et voir le détail des modifications.");
                $scope.vizTitle = "ARTICLES";
            },
            link: function postLink(scope, element) {


                var mod1 = thelawfactory.mod1();

                function update() {

                    thelawfactory.utils.spinner.start();

                    api.getArticle(scope.loi).then(function (data) {
                        $rootScope.lawTitle = data.short_title;
                        $rootScope.pageTitle = $rootScope.lawTitle + " - Articles | ";
                        var timeout = 1500,
                            loop = setInterval(function () {
                                timeout -= 50;
                                if (timeout > 0 && !scope.steps) return;
                                clearInterval(loop);
                                scope.currentstep = (scope.steps && !scope.steps[scope.steps.length - 1].enddate ? scope.steps[scope.steps.length - 1] : undefined);
                                d3.select(element[0]).datum(data).call(mod1);
                                thelawfactory.utils.spinner.stop();
                            }, 50);
                    }, function () {
                        scope.display_error("impossible de trouver les articles de ce texte");
                    });

                }

                update();
            }
        };
    }]).directive('mod2', ['api', '$rootScope', '$location', '$compile',
    function (api, $rootScope) {
        return {
            restrict: 'A',
            replace: false,
            templateUrl: 'templates/mod2.html',
            controller: function ($scope) {
                $scope.step = 0;
                $scope.mod = "mod2";
                $scope.setHelpText("Chaque boîte représente un amendement dont le pictogramme indique le sort et la couleur le groupe politique de ses auteurs. Cliquez sur un amendement pour en lire le contenu et les détails.");
                $scope.vizTitle = "AMENDEMENTS";
            },
            link: function postLink(scope, element) {

                var mod2 = thelawfactory.mod2();

                function update() {

                    thelawfactory.utils.spinner.start();

                    if (scope.etape != null) api.getAmendement(scope.loi, scope.etape).then(function (data) {
                        scope.data = data;
                        $rootScope.pageTitle = $rootScope.lawTitle + " - Amendements | ";
                        d3.select(element[0]).datum(data).call(mod2);
                    }, function () {
                        scope.display_error("impossible de trouver les amendements pour ce texte à cette étape");
                    });
                }

                update();
            }
        }
    }])
    .directive('mod2b', ['api', '$rootScope', '$location', '$compile',
        function (api, $rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/mod2b.html',
                controller: function ($scope) {
                    $scope.step = 0;
                    $scope.mod = "mod2b";
                    $scope.setHelpText("Chaque boîte représente un groupe d'orateurs intervenus dans les débats sur un sujet. La longueur indique le nombre de mots prononcés et la couleur le groupe politique. Cliquez sur une boîte pour voir la liste des orateurs et consulter le texte des débats.");
                    $scope.vizTitle = "DÉBATS";
                },
                link: function postLink(scope) {

                    function update() {

                        thelawfactory.utils.spinner.start();

                        if (scope.etape != null) {

                            api.getIntervention(scope.loi).then(function (data) {
                                scope.data = data;
                                $rootScope.pageTitle = $rootScope.lawTitle + " - Débats | ";
                                init(data, scope.etape);
                            }, function () {
                                scope.display_error("impossible de trouver les interventions pour ce texte à cette étape");
                            })
                        }
                    }

                    update();
                }
            };
        }])
    .directive('mod0', ['api', '$rootScope', '$location', '$compile',
        function (api, $rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/mod0.html',
                controller: function ($scope) {
                    $scope.mod = "mod0";
                    $scope.setHelpText("Chaque ligne représente la chronologie des débats sur un projet ou une proposition de loi. La couleur indique l'institution en charge du texte à un instant donné (Assemblée en bleu, Sénat en rouge...). Cliquez sur un texte pour en consulter le résumé et en explorer les articles.");
                    $scope.vizTitle = "NAVETTES";
                },
                link: function postLink(scope, element) {

                    $rootScope.pageTitle = "";

                    $(".title").html('<h4 class="law-title">Explorer les textes promulgués depuis 2010</h4>');
                    $("#mod0-slider").slider({
                        min: 1,
                        max: 10,
                        animate: true,
                        value: 1,
                        slide: function (event, ui) {
                            thelawfactory.mod0.zooming(ui.value);
                        }
                    });
                    var mod0 = thelawfactory.mod0();

                    function update() {
                        thelawfactory.utils.spinner.start();
                        api.getDossiers().then(function (data) {
                            d3.select(element[0]).datum(data).call(mod0);
                        }, function () {
                            scope.display_error("impossible de trouver les données relatives aux textes");
                        })
                    }

                    update();

                }
            };
        }])
    .directive('lawlist', ['api', '$rootScope', "$location",
        function (api, $rootScope, $location) {
            return {
                restrict: 'A',
                replace: false,
                link: function postLink(scope) {
                    function update() {
                        api.getLawlist().then(function (data) {
                            scope.ll = data;
                            // Process data to a list of law object
                            // with properties' names set by headers
                            var headers, laws, rows = scope.ll.split(/\r\n|\n/);
                            headers = rows.splice(0, 1)[0].split(";").map(function (x) {
                                return x.replace(/(^"|"$)/g, '')
                            });
                            laws = $.map(rows, function (row) {
                                var law = {}, lawdata = row.split(';').map(function (x) {
                                    return x.replace(/(^"|"$)/g, '')
                                });
                                $.each(headers, function (i, header) {
                                    law[header] = lawdata[i];
                                });
                                return law;
                            });

                            document.lawlist = laws;

                            $("#search").mouseenter(function () {
                                $(".form-law").css('opacity', 1);
                            }).mouseleave(function () {
                                $(".form-law").css('opacity', 0.3);
                            }).autocomplete({
                                source: function (request, response) {
                                    var matcher = new RegExp($.ui.autocomplete.escapeRegex(clean_accents(request.term)), "i");
                                    response($.map($.grep(laws.sort(function (a, b) {
                                        return b["Date de promulgation"] > a["Date de promulgation"];
                                    }), function (value) {
                                        value = clean_accents(value.Titre + " " + value.id + " " + value["Thèmes"] + " " + value.short_title);
                                        return matcher.test(clean_accents(value));
                                    }), function (n) {
                                        return {
                                            "label": n.short_title.replace(/ \([^)]*\)/g, '') + " (" + n.Titre + ")",
                                            "value": n.id,
                                            "themes": n["Thèmes"],
                                            "amendements": n.total_amendements,
                                            "words": n.total_mots,
                                            "dates": n["Date initiale"] + (n["Date de promulgation"] ? " → " + n["Date de promulgation"] : "")
                                        }
                                    }));
                                },
                                focus: function (event, ui) {
                                    $(".form-law").css('opacity', 1);
                                    event.preventDefault();
                                    $(".src-fcs").removeClass("src-fcs");
                                    $("." + ui.item.value).addClass("src-fcs");
                                },
                                open: function () {
                                    $(".form-law").css('opacity', 1);
                                    var h = $(".ui-autocomplete").position().top;
                                    $(".ui-autocomplete").css({
                                        'max-height': $(window).height() - h - 100,
                                        'overflow-y': 'scroll'
                                    });
                                },
                                close: function () {
                                    $(".form-law").css('opacity', 0.3);
                                    $('#header-search .message').text('');
                                },
                                appendTo: ".lawlist",
                                select: function (event, ui) {
                                    $rootScope.$apply(function () {
                                        $("body").css("overflow", "auto");
                                        $location.path(($location.path() === '/lois.html' ? 'loi' : 'article') + "s.html");
                                        $location.search("loi=" + ui.item.value);
                                        $(".form-law").css('opacity', 0.3);
                                    });
                                },
                                messages: {
                                    noResults: function () {
                                        var msg = 'Aucune loi trouvée';
                                        $('#header-search .message').text(msg);
                                        return msg;
                                    },
                                    results: function (d) {
                                        var msg = d + " loi" + (d > 1 ? "s trouvées" : " trouvée");
                                        $('#header-search .message').text(msg);
                                        return msg;
                                    }
                                }
                            })
                                .data("ui-autocomplete")._renderItem = function (ul, item) {
                                var themesdiv = $("<div>");
                                item.themes.replace(/ et /g, ', ').split(', ').forEach(function (e) {
                                    themesdiv.append("<span class='glyphicon glyphicon-tag'></span> " + e.toLowerCase() + " ");
                                });

                                var icodiv = $("<div class='src-ico'>")
                                    .append('<div><span class="glyphicon glyphicon-calendar"></span> ' + item.dates + "</div>")
                                    .append('<div title="' + item.amendements + ' amendements déposés sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-folder-open" style="opacity: ' + opacity_amdts(item.amendements) + '"></span> ' + item.amendements + "</div>")
                                    .append('<div title="' + item.words + ' mots prononcés lors des débats sur ce texte" class="search" data-toggle="tooltip" data-placement="bottom"><span class="glyphicon glyphicon-comment" style="opacity: ' + opacity_mots(item.words) + '"></span> ' + 1000 * (Math.round(item.words / 1000.)) + "</div>")
                                    .append(themesdiv);
                                $(".search").tooltip();

                                var txtdiv = $("<div class='src-txt'>")
                                    .append("<a>" + item.label + "</a>")
                                    .append(icodiv);

                                return $("<li class=" + item.value + ">")
                                    .append(txtdiv)
                                    .appendTo(ul);
                            };
                        }, function () {
                            scope.display_error("impossible de trouver les données de recherche sur les textes");
                        })
                    }

                    update();
                }
            }
        }])
    .directive('movescroll', ['$rootScope', function () {
        return {
            restrict: 'A',
            controller: function ($scope) {
                $scope.pos = [-1, -1];
                $scope.xmouselerp = d3.scale.linear().range([-100, 0, 0, 100]).clamp(true);
                $scope.ymouselerp = d3.scale.linear().range([-100, 0, 0, 100]).clamp(true);
            },
            link: function postLink(scope, element) {

                scope.xmouselerp.domain([0, element.width() * 0.2, element.width() * 0.8, element.width()]);
                scope.ymouselerp.domain([0, element.height() * 0.2, element.height() * 0.8, element.height()]);

                var clicking = false;
                var inpos = [-1, -1];
                // No dragging in the borders because of issues with the overflow scollbar
                var gantt_o = $('#gantt').offset(),
                    mouse_xmax = gantt_o.left + $('#gantt').width() - 20,
                    mouse_ymax = gantt_o.top + $('#gantt').height() - 20;

                element.mousedown(function (e) {
                    if (e.pageX > mouse_xmax || e.pageY > mouse_ymax)
                        return;
                    clicking = true;
                    inpos[0] = e.pageX;
                    inpos[1] = e.pageY;
                });

                $(document).mouseup(function () {
                    clicking = false;
                    inpos = [-1, -1];
                });

                element.mousemove(function (e) {
                    if (clicking == false) return;
                    e.stopPropagation();
                    var x = (e.pageX - inpos[0]) * 2;
                    var y = (e.pageY - inpos[1]) * 2;
                    element.scrollTop(element.scrollTop() - y);
                    element.scrollLeft(element.scrollLeft() - x);
                    inpos[0] = e.pageX;
                    inpos[1] = e.pageY;
                });
            }
        };
    }])
    .directive('stepsbar', ['$timeout', 'api', '$rootScope', "$location",
        function ($timeout, api, $rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/stepsbar.html',
                link: function (scope) {
                    scope.total = 0;
                    api.getProcedure(scope.loi).then(function (data) {

                        var tit = upperFirst(data.long_title),
                            leg = "";
                        if (tit.length > 60) {
                            leg = ' data-toggle="tooltip" data-placement="right" title="' + tit + '"';
                            tit = scope.loi.substr(0, 3).toUpperCase() + " " + upperFirst(data.short_title);
                        }
                        $(".title").html(
                            '<h4 class="law-title"' + leg + '>' + tit + '</h4>' +
                            '<div class="allinks darkonintrojs"><span class="links">' +
                            (data.url_jo ? '<a href="' + data.url_jo + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Loi sur Légifrance</a><br/>' : '') +
                            '<a href="' + scope.APIRootUrl + scope.loi + '/" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Open Data</a>' +
                            '&nbsp; /<a href="http://git.lafabriquedelaloi.fr/parlement/' + scope.loi + '/" target="_blank" class="darkonintrojs">Git</a>' +
                            '</span><span class="links">' +
                            (data.url_dossier_senat ? '<a href="' + data.url_dossier_senat + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Dossier Sénat</a>' : '') + '<br/>' +
                            (data.url_dossier_assemblee ? '<a href="' + data.url_dossier_assemblee + '" target="_blank" class="darkonintrojs"><span class="glyphicon glyphicon-link"></span> Dossier Assemblée</a>' : '') +
                            '</span></div>'
                        );
                        if (leg) $(".law-title").tooltip();

                        scope.stages = [];
                        scope.steps = [];
                        scope.inst = [];
                        var currStage = {name: "", num: 1},
                            currInst = {name: "", num: 1};
                        if (!$rootScope.lawTitle) {
                            $rootScope.lawTitle = data.short_title;
                            $rootScope.pageTitle = ($rootScope.pageTitle + "").replace('undefined', $rootScope.lawTitle);
                        }

                        data.steps.forEach(function (e) {
                            if (e.debats_order !== null) scope.total++;
                        });
                        scope.barwidth = $("#stepsbar").width();

                        data.steps.filter(function (e) {
                            return e.debats_order != null;
                        })
                            .sort(function (a, b) {
                                return a.debats_order - b.debats_order;
                            })
                            .forEach(function (e) {
                                scope.steps.push(e);
                                e.short_name = stepLabel(e);
                                e.long_name = stepLegend(e);
                                e.display_short = (scope.barwidth / scope.total < (e.step == "depot" && e.auteur_depot != "Gouvernement" ? 150 : 120));

                                if (e.step === "depot") {
                                    if (currStage.name) currStage.num++;
                                    else currStage.name = "depot";
                                    if (currStage.num == 2) currStage.name += "s";
                                } else if (currStage.name === e.stage) {
                                    currStage.num++;
                                } else {
                                    if (currStage.name)
                                        scope.stages.push(addStageInst(currStage));
                                    currStage.num = 1;
                                    currStage.name = e.stage;
                                }

                                if ((e.step === "depot" && currInst.name === e.auteur_depot) || (e.step !== "depot" && e.institution === currInst.name))
                                    currInst.num++;
                                else {
                                    if (currInst.name)
                                        scope.inst.push(addStageInst(currInst));
                                    currInst.num = 1;
                                    currInst.name = (e.step === "depot" ? e.auteur_depot : e.institution);
                                }
                            });

                        scope.stages.push(addStageInst(currStage));
                        scope.inst.push(addStageInst(currInst));
                        $timeout(function () {
                            $(".stb-step span").tooltip({html: true});
                            $(".stb-step a").tooltip({html: true});
                            $(".stb-inst span").tooltip();
                            $(".stb-stage span").tooltip({html: true});
                        }, 0);

                    }, function () {
                        scope.display_error("impossible de trouver la procédure de ce texte");
                    });

                    function addStageInst (currObj) {
                        var obj = $.extend(true, {}, currObj);
                        obj.long_name = thelawfactory.utils.getLongName(obj.name);
                        obj.short_name = thelawfactory.utils.getShortName(obj.name);
                        obj.display_short = (obj.long_name != obj.short_name && scope.barwidth * obj.num / scope.total < (obj.name === "CMP" ? 190 : 130));
                        return obj;
                    }

                    function stepLegend (el) {
                        if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "Projet de Loi" : "Proposition de Loi");
                        else return thelawfactory.utils.getLongName(el.step);
                    }

                    function stepLabel (el) {
                        if (el.step === "depot") return (el.auteur_depot == "Gouvernement" ? "PJL" : "PPL");
                        return thelawfactory.utils.getShortName(el.step);
                    }
                }
            }
        }
    ])
    .directive('about', ['$rootScope', '$location', '$compile',
        function ($rootScope) {
            return {
                restrict: 'A',
                replace: false,
                templateUrl: 'templates/about.html',
                controller: function ($scope) {
                    $rootScope.pageTitle = " À propos | ";
                    $scope.mod = "about";
                }
            }
        }])
    .directive('tutorial', function() {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                mod: '@'
            },
            template: '<li id="menu-tutorial" ng-click="toggleTutorial()" class="pull-right"><span title="Voir le tutoriel" data-toggle="tooltip" data-placement="left"><a>?</a></span></li>',
            controller: function ($timeout, $rootScope, $scope, api) {
                $scope.toggleTutorial = function () {
                    if (!$rootScope.tutorial) {
                        $rootScope.tutorial = true;
                        api.getTutorials().then(function (data) {
                                var tuto = data[$scope.mod];
                                var step = 1;
                                var actions = [];
                                var tutoKeys = d3.keys(tuto);
                                var i, tutoLen = tutoKeys.length;
                                for (i = 0 ; i < tutoLen ; ++i) {
                                    var id = tutoKeys[i];
                                    if (tuto[id].indexOf('@') != -1) {
                                        var message = tuto[id].split(' @ ');
                                        tuto[id] = message[0];
                                        actions[step] = message[1];
                                    } else {
                                        actions[step] = '';
                                    }
                                    var infos = tuto[id].split(" = ");
                                    if (id.substring(0, 4) == '.svg') {
                                        id = id.substring(4);
                                        id = drawDivOverElement($(id), id);
                                    }
                                    $(id).attr('data-position', infos[0]);
                                    $(id).attr('data-tooltipClass', 'tooltip-' + id.replace(/^[#\.]/, "")); // remove selector (first # or .)
                                    $(id).attr('data-intro', infos[1]);
                                    $(id).attr('data-step', step++);
                                }
                                var introjs = introJs().setOptions({
                                    showBullets: false,
                                    showStepNumbers: false,
                                    nextLabel: "suite...",
                                    prevLabel: "...retour",
                                    skipLabel: "quitter ce tutoriel",
                                    doneLabel: "quitter ce tutoriel"
                                });
                                introjs.onbeforechange(function (e) {
                                    if ($(e).hasClass('div-over-svg'))
                                        $('.div-over-svg').show();
                                    else $('.div-over-svg').hide();
                                    var data_step = $(e).attr('data-step');
                                    var acts = actions[data_step].split(' , ');
                                    $.each(acts, function (index, value) {
                                        var action = value.split(' = ');
                                        switch (action[0]) {
                                            case 'scrolltop' :
                                                $(action[1]).scrollTop(0);
                                                break;
                                            case 'click' :
                                                $(action[1]).css('opacity', 1);
                                                try {
                                                    $(action[1]).d3Click();
                                                    $(action[1]).click();
                                                    $(action[1])[0].click();
                                                } catch (e) {
                                                }
                                                break;
                                            case 'zoom' :
                                                thelawfactory.mod0.zooming(parseInt(action[1]));
                                                break;
                                        }
                                    });
                                });
                                var exit_introjs = function () {
                                    $('.div-over-svg').remove();
                                    $(window).scrollTop(0);
                                    $rootScope.tutorial = false;
                                    localStorage.setItem("tuto-" + $scope.mod, "done");
                                };
                                introjs.onexit(exit_introjs);
                                introjs.oncomplete(exit_introjs);
                                $timeout(function() {
                                    introjs.start();
                                }, 0);
                            },
                            function () {
                                console.log("couldn't retrieve json tutorial");
                            }
                        );
                    }
                };

                function getSVGScale (t) {
                    t = t[0];
                    var xforms = t.transform.animVal,
                        firstXForm, i = 0;
                    while (i < xforms.numberOfItems) {
                        firstXForm = xforms.getItem(i);
                        i++;
                        if (firstXForm.type == SVGTransform.SVG_TRANSFORM_SCALE)
                            return [firstXForm.matrix.a,
                                firstXForm.matrix.d];
                    }
                    return [1, 1];
                }

                function getSVGTranslate (t) {
                    t = t[0];
                    var xforms = t.transform.baseVal,
                        firstXForm, i = 0;
                    while (i < xforms.numberOfItems) {
                        firstXForm = xforms.getItem(i);
                        i++;
                        if (firstXForm.type == SVGTransform.SVG_TRANSFORM_TRANSLATE)
                            return [firstXForm.matrix.e,
                                firstXForm.matrix.f];
                    }
                    return [0, 0];
                }

                /**
                 * Draw a div over the jQuery node passed as argument
                 */
                function drawDivOverElement (oElement, sElementClass) {
                    var selk = $scope.mod == "mod0" ? '#gantt' : '#viz';
                    if (oElement.prop('tagName') == 'rect') {
                        var oNewElement = oElement.clone(true);
                        oNewElement.attr('x', 0).attr('y', 0).attr('style', oElement.parent().attr('style'));
                        var scale0 = getSVGScale(oElement.parent());
                        var scale1 = getSVGScale(oElement.parent().parent());
                        var trans0 = getSVGTranslate(oElement.parent());
                        var trans1 = getSVGTranslate(oElement.parent().parent());
                        var width = oElement.attr('width') * scale0[0] * scale1[0];
                        var height = oElement.attr('height') * scale0[1] * scale1[1];
                        var left = $(selk).offset().left +
                            parseInt(oElement.attr('x')) * scale0[0] * scale1[0] +
                            trans0[0] + trans1[0];
                        var top = $(selk).offset().top +
                            parseInt(oElement.attr('y')) * scale0[1] * scale1[1] +
                            trans0[1] + trans1[1];
                    } else if (oElement.prop('tagName') == 'g') {
                        var oNewElement = oElement.clone(true);
                        var bbox = d3.select(sElementClass)[0][0].getBBox();
                        var width = bbox.width;
                        var height = bbox.height;
                        if ($scope.mod == "mod2")
                            height += 20;
                        var top = $(selk).offset().top + d3.select(sElementClass)[0][0].getBBox().y + parseInt(oElement.attr('data-offset'));
                        var left = $(selk).offset().left + bbox.x;
                        oNewElement.find('*').each(function () {
                            var x = $(this).attr('x');
                            $(this).attr('x', x - bbox.x);
                            var y = $(this).attr('y');
                            $(this).attr('y', y - bbox.y);
                        });
                    } else {
                        console.log("Weird tag given on element: ", oElement, oElement.prop('tagName'));
                    }
                    var sElementClass = sElementClass.replace('.', '') + '-div';
                    var node = '<div class="' + sElementClass + ' div-over-svg" style="position: absolute; top: ' + top + 'px; left : ' + left + 'px; width: ' + width + 'px; height: ' + height + 'px;"><svg id="introsvg"></svg></div>';
                    $('body').append(node);
                    $("#introsvg").append(oNewElement);
                    return '.' + sElementClass;
                }
            }
        }
    });