/* Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
 * Dual licensed under the MIT (MIT_LICENSE.txt)
 * and GPL Version 2 (GPL_LICENSE.txt) licenses.
 *
 * Version: 1.1.1
 * Requires jQuery 1.3+
 * Docs: http://docs.jquery.com/Plugins/livequery
 */
(function(a) {
    a.extend(a.fn, {
        livequery: function(e, d, c) {
            var b = this,
                f;
            if (a.isFunction(e)) { c = d, d = e, e = undefined }
            a.each(a.livequery.queries, function(g, h) { if (b.selector == h.selector && b.context == h.context && e == h.type && (!d || d.$lqguid == h.fn.$lqguid) && (!c || c.$lqguid == h.fn2.$lqguid)) { return (f = h) && false } });
            f = f || new a.livequery(this.selector, this.context, e, d, c);
            f.stopped = false;
            f.run();
            return this
        },
        expire: function(e, d, c) {
            var b = this;
            if (a.isFunction(e)) { c = d, d = e, e = undefined }
            a.each(a.livequery.queries, function(f, g) { if (b.selector == g.selector && b.context == g.context && (!e || e == g.type) && (!d || d.$lqguid == g.fn.$lqguid) && (!c || c.$lqguid == g.fn2.$lqguid) && !this.stopped) { a.livequery.stop(g.id) } });
            return this
        }
    });
    a.livequery = function(b, d, f, e, c) {
        this.selector = b;
        this.context = d;
        this.type = f;
        this.fn = e;
        this.fn2 = c;
        this.elements = [];
        this.stopped = false;
        this.id = a.livequery.queries.push(this) - 1;
        e.$lqguid = e.$lqguid || a.livequery.guid++;
        if (c) { c.$lqguid = c.$lqguid || a.livequery.guid++ }
        return this
    };
    a.livequery.prototype = {
        stop: function() {
            var b = this;
            if (this.type) { this.elements.unbind(this.type, this.fn) } else { if (this.fn2) { this.elements.each(function(c, d) { b.fn2.apply(d) }) } }
            this.elements = [];
            this.stopped = true
        },
        run: function() {
            if (this.stopped) { return }
            var d = this;
            var e = this.elements,
                c = a(this.selector, this.context),
                b = c.not(e);
            this.elements = c;
            if (this.type) { b.bind(this.type, this.fn); if (e.length > 0) { a.each(e, function(f, g) { if (a.inArray(g, c) < 0) { a.event.remove(g, d.type, d.fn) } }) } } else { b.each(function() { d.fn.apply(this) }); if (this.fn2 && e.length > 0) { a.each(e, function(f, g) { if (a.inArray(g, c) < 0) { d.fn2.apply(g) } }) } }
        }
    };
    a.extend(a.livequery, {
        guid: 0,
        queries: [],
        queue: [],
        running: false,
        timeout: null,
        checkQueue: function() { if (a.livequery.running && a.livequery.queue.length) { var b = a.livequery.queue.length; while (b--) { a.livequery.queries[a.livequery.queue.shift()].run() } } },
        pause: function() { a.livequery.running = false },
        play: function() {
            a.livequery.running = true;
            a.livequery.run()
        },
        registerPlugin: function() {
            a.each(arguments, function(c, d) {
                if (!a.fn[d]) { return }
                var b = a.fn[d];
                a.fn[d] = function() {
                    var e = b.apply(this, arguments);
                    a.livequery.run();
                    return e
                }
            })
        },
        run: function(b) {
            if (b != undefined) { if (a.inArray(b, a.livequery.queue) < 0) { a.livequery.queue.push(b) } } else { a.each(a.livequery.queries, function(c) { if (a.inArray(c, a.livequery.queue) < 0) { a.livequery.queue.push(c) } }) }
            if (a.livequery.timeout) { clearTimeout(a.livequery.timeout) }
            a.livequery.timeout = setTimeout(a.livequery.checkQueue, 20)
        },
        stop: function(b) { if (b != undefined) { a.livequery.queries[b].stop() } else { a.each(a.livequery.queries, function(c) { a.livequery.queries[c].stop() }) } }
    });
    a.livequery.registerPlugin("append", "prepend", "after", "before", "wrap", "attr", "removeAttr", "addClass", "removeClass", "toggleClass", "empty", "remove", "html");
    a(function() { a.livequery.play() })
})(jQuery);

(function() {
    "use strict";
    var definePinchZoom = function($) {
        var PinchZoom = function(el, options) {
                this.el = $(el);
                this.zoomFactor = 1;
                this.lastScale = 1;
                this.offset = { x: 0, y: 0 };
                this.options = $.extend({}, this.defaults, options);
                this.setupMarkup();
                this.bindEvents();
                this.update();
                this.enable()
            },
            sum = function(a, b) { return a + b },
            isCloseTo = function(value, expected) { return value > expected - .01 && value < expected + .01 };
        PinchZoom.prototype = {
            defaults: { tapZoomFactor: 2, zoomOutFactor: 1.3, animationDuration: 300, animationInterval: 5, maxZoom: 4, minZoom: .5, lockDragAxis: false, use2d: true, zoomStartEventName: "pz_zoomstart", zoomEndEventName: "pz_zoomend", dragStartEventName: "pz_dragstart", dragEndEventName: "pz_dragend", doubleTapEventName: "pz_doubletap" },
            handleDragStart: function(event) {
                this.el.trigger(this.options.dragStartEventName);
                this.stopAnimation();
                this.lastDragPosition = false;
                this.hasInteraction = true;
                this.handleDrag(event)
            },
            handleDrag: function(event) {
                if (this.zoomFactor > 1) {
                    var touch = this.getTouches(event)[0];
                    this.drag(touch, this.lastDragPosition);
                    this.offset = this.sanitizeOffset(this.offset);
                    this.lastDragPosition = touch
                }
            },
            handleDragEnd: function() {
                this.el.trigger(this.options.dragEndEventName);
                this.end()
            },
            handleZoomStart: function(event) {
                this.el.trigger(this.options.zoomStartEventName);
                this.stopAnimation();
                this.lastScale = 1;
                this.nthZoom = 0;
                this.lastZoomCenter = false;
                this.hasInteraction = true
            },
            handleZoom: function(event, newScale) {
                var touchCenter = this.getTouchCenter(this.getTouches(event)),
                    scale = newScale / this.lastScale;
                this.lastScale = newScale;
                this.nthZoom += 1;
                if (this.nthZoom > 3) {
                    this.scale(scale, touchCenter);
                    this.drag(touchCenter, this.lastZoomCenter)
                }
                this.lastZoomCenter = touchCenter
            },
            handleZoomEnd: function() {
                this.el.trigger(this.options.zoomEndEventName);
                this.end()
            },
            handleDoubleTap: function(event) {
                var center = this.getTouches(event)[0],
                    zoomFactor = this.zoomFactor > 1 ? 1 : this.options.tapZoomFactor,
                    startZoomFactor = this.zoomFactor,
                    updateProgress = function(progress) { this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center) }.bind(this);
                if (this.hasInteraction) { return }
                if (startZoomFactor > zoomFactor) { center = this.getCurrentZoomCenter() }
                this.animate(this.options.animationDuration, this.options.animationInterval, updateProgress, this.swing);
                this.el.trigger(this.options.doubleTapEventName)
            },
            sanitizeOffset: function(offset) {
                var maxX = (this.zoomFactor - 1) * this.getContainerX(),
                    maxY = (this.zoomFactor - 1) * this.getContainerY(),
                    maxOffsetX = Math.max(maxX, 0),
                    maxOffsetY = Math.max(maxY, 0),
                    minOffsetX = Math.min(maxX, 0),
                    minOffsetY = Math.min(maxY, 0);
                return { x: Math.min(Math.max(offset.x, minOffsetX), maxOffsetX), y: Math.min(Math.max(offset.y, minOffsetY), maxOffsetY) }
            },
            scaleTo: function(zoomFactor, center) { this.scale(zoomFactor / this.zoomFactor, center) },
            scale: function(scale, center) {
                scale = this.scaleZoomFactor(scale);
                this.addOffset({ x: (scale - 1) * (center.x + this.offset.x), y: (scale - 1) * (center.y + this.offset.y) })
            },
            scaleZoomFactor: function(scale) {
                var originalZoomFactor = this.zoomFactor;
                this.zoomFactor *= scale;
                this.zoomFactor = Math.min(this.options.maxZoom, Math.max(this.zoomFactor, this.options.minZoom));
                return this.zoomFactor / originalZoomFactor
            },
            drag: function(center, lastCenter) { if (lastCenter) { if (this.options.lockDragAxis) { if (Math.abs(center.x - lastCenter.x) > Math.abs(center.y - lastCenter.y)) { this.addOffset({ x: -(center.x - lastCenter.x), y: 0 }) } else { this.addOffset({ y: -(center.y - lastCenter.y), x: 0 }) } } else { this.addOffset({ y: -(center.y - lastCenter.y), x: -(center.x - lastCenter.x) }) } } },
            getTouchCenter: function(touches) { return this.getVectorAvg(touches) },
            getVectorAvg: function(vectors) { return { x: vectors.map(function(v) { return v.x }).reduce(sum) / vectors.length, y: vectors.map(function(v) { return v.y }).reduce(sum) / vectors.length } },
            addOffset: function(offset) { this.offset = { x: this.offset.x + offset.x, y: this.offset.y + offset.y } },
            sanitize: function() { if (this.zoomFactor < this.options.zoomOutFactor) { this.zoomOutAnimation() } else if (this.isInsaneOffset(this.offset)) { this.sanitizeOffsetAnimation() } },
            isInsaneOffset: function(offset) { var sanitizedOffset = this.sanitizeOffset(offset); return sanitizedOffset.x !== offset.x || sanitizedOffset.y !== offset.y },
            sanitizeOffsetAnimation: function() {
                var targetOffset = this.sanitizeOffset(this.offset),
                    startOffset = { x: this.offset.x, y: this.offset.y },
                    updateProgress = function(progress) {
                        this.offset.x = startOffset.x + progress * (targetOffset.x - startOffset.x);
                        this.offset.y = startOffset.y + progress * (targetOffset.y - startOffset.y);
                        this.update()
                    }.bind(this);
                this.animate(this.options.animationDuration, this.options.animationInterval, updateProgress, this.swing)
            },
            zoomOutAnimation: function() {
                var startZoomFactor = this.zoomFactor,
                    zoomFactor = 1,
                    center = this.getCurrentZoomCenter(),
                    updateProgress = function(progress) { this.scaleTo(startZoomFactor + progress * (zoomFactor - startZoomFactor), center) }.bind(this);
                this.animate(this.options.animationDuration, this.options.animationInterval, updateProgress, this.swing)
            },
            updateAspectRatio: function() { this.setContainerY(this.getContainerX() / this.getAspectRatio()) },
            getInitialZoomFactor: function() { return this.container[0].offsetWidth / this.el[0].offsetWidth },
            getAspectRatio: function() { return this.el[0].offsetWidth / this.el[0].offsetHeight },
            getCurrentZoomCenter: function() {
                var length = this.container[0].offsetWidth * this.zoomFactor,
                    offsetLeft = this.offset.x,
                    offsetRight = length - offsetLeft - this.container[0].offsetWidth,
                    widthOffsetRatio = offsetLeft / offsetRight,
                    centerX = widthOffsetRatio * this.container[0].offsetWidth / (widthOffsetRatio + 1),
                    height = this.container[0].offsetHeight * this.zoomFactor,
                    offsetTop = this.offset.y,
                    offsetBottom = height - offsetTop - this.container[0].offsetHeight,
                    heightOffsetRatio = offsetTop / offsetBottom,
                    centerY = heightOffsetRatio * this.container[0].offsetHeight / (heightOffsetRatio + 1);
                if (offsetRight === 0) { centerX = this.container[0].offsetWidth }
                if (offsetBottom === 0) { centerY = this.container[0].offsetHeight }
                return { x: centerX, y: centerY }
            },
            canDrag: function() { return !isCloseTo(this.zoomFactor, 1) },
            getTouches: function(event) { var position = this.container.offset(); return Array.prototype.slice.call(event.touches).map(function(touch) { return { x: touch.pageX - position.left, y: touch.pageY - position.top } }) },
            animate: function(duration, interval, framefn, timefn, callback) {
                var startTime = (new Date).getTime(),
                    renderFrame = function() {
                        if (!this.inAnimation) { return }
                        var frameTime = (new Date).getTime() - startTime,
                            progress = frameTime / duration;
                        if (frameTime >= duration) {
                            framefn(1);
                            if (callback) { callback() }
                            this.update();
                            this.stopAnimation();
                            this.update()
                        } else {
                            if (timefn) { progress = timefn(progress) }
                            framefn(progress);
                            this.update();
                            setTimeout(renderFrame, interval)
                        }
                    }.bind(this);
                this.inAnimation = true;
                renderFrame()
            },
            stopAnimation: function() { this.inAnimation = false },
            swing: function(p) { return -Math.cos(p * Math.PI) / 2 + .5 },
            getContainerX: function() { return this.container[0].offsetWidth },
            getContainerY: function() { return this.container[0].offsetHeight },
            setContainerY: function(y) { return this.container.height(y) },
            setupMarkup: function() {
                this.container = $('<div class="pinch-zoom-container"></div>');
                this.el.before(this.container);
                this.container.append(this.el);
                this.container.css({ overflow: "hidden", position: "relative" });
                this.el.css({ "-webkit-transform-origin": "0% 0%", "-moz-transform-origin": "0% 0%", "-ms-transform-origin": "0% 0%", "-o-transform-origin": "0% 0%", "transform-origin": "0% 0%", position: "absolute" })
            },
            end: function() {
                this.hasInteraction = false;
                this.sanitize();
                this.update()
            },
            bindEvents: function() {
                detectGestures(this.container.get(0), this);
                $(window).on("resize", this.update.bind(this));
                $(this.el).find("img").on("load", this.update.bind(this))
            },
            update: function() {
                if (this.updatePlaned) { return }
                this.updatePlaned = true;
                setTimeout(function() {
                    this.updatePlaned = false;
                    this.updateAspectRatio();
                    var zoomFactor = this.getInitialZoomFactor() * this.zoomFactor,
                        offsetX = -this.offset.x / zoomFactor,
                        offsetY = -this.offset.y / zoomFactor,
                        transform3d = "scale3d(" + zoomFactor + ", " + zoomFactor + ",1) " + "translate3d(" + offsetX + "px," + offsetY + "px,0px)",
                        transform2d = "scale(" + zoomFactor + ", " + zoomFactor + ") " + "translate(" + offsetX + "px," + offsetY + "px)",
                        removeClone = function() {
                            if (this.clone) {
                                this.clone.remove();
                                delete this.clone
                            }
                        }.bind(this);
                    if (!this.options.use2d || this.hasInteraction || this.inAnimation) {
                        this.is3d = true;
                        removeClone();
                        this.el.css({ "-webkit-transform": transform3d, "-o-transform": transform2d, "-ms-transform": transform2d, "-moz-transform": transform2d, transform: transform3d })
                    } else {
                        if (this.is3d) {
                            this.clone = this.el.clone();
                            this.clone.css("pointer-events", "none");
                            this.clone.appendTo(this.container);
                            setTimeout(removeClone, 200)
                        }
                        this.el.css({ "-webkit-transform": transform2d, "-o-transform": transform2d, "-ms-transform": transform2d, "-moz-transform": transform2d, transform: transform2d });
                        this.is3d = false
                    }
                }.bind(this), 0)
            },
            enable: function() { this.enabled = true },
            disable: function() { this.enabled = false }
        };
        var detectGestures = function(el, target) {
            var interaction = null,
                fingers = 0,
                lastTouchStart = null,
                startTouches = null,
                setInteraction = function(newInteraction, event) {
                    if (interaction !== newInteraction) {
                        if (interaction && !newInteraction) {
                            switch (interaction) {
                                case "zoom":
                                    target.handleZoomEnd(event);
                                    break;
                                case "drag":
                                    target.handleDragEnd(event);
                                    break
                            }
                        }
                        switch (newInteraction) {
                            case "zoom":
                                target.handleZoomStart(event);
                                break;
                            case "drag":
                                target.handleDragStart(event);
                                break
                        }
                    }
                    interaction = newInteraction
                },
                updateInteraction = function(event) { if (fingers === 2) { setInteraction("zoom") } else if (fingers === 1 && target.canDrag()) { setInteraction("drag", event) } else { setInteraction(null, event) } },
                targetTouches = function(touches) { return Array.prototype.slice.call(touches).map(function(touch) { return { x: touch.pageX, y: touch.pageY } }) },
                getDistance = function(a, b) {
                    var x, y;
                    x = a.x - b.x;
                    y = a.y - b.y;
                    return Math.sqrt(x * x + y * y)
                },
                calculateScale = function(startTouches, endTouches) {
                    var startDistance = getDistance(startTouches[0], startTouches[1]),
                        endDistance = getDistance(endTouches[0], endTouches[1]);
                    return endDistance / startDistance
                },
                cancelEvent = function(event) {
                    event.stopPropagation();
                    event.preventDefault()
                },
                detectDoubleTap = function(event) {
                    var time = (new Date).getTime();
                    if (fingers > 1) { lastTouchStart = null }
                    if (time - lastTouchStart < 300) {
                        cancelEvent(event);
                        target.handleDoubleTap(event);
                        switch (interaction) {
                            case "zoom":
                                target.handleZoomEnd(event);
                                break;
                            case "drag":
                                target.handleDragEnd(event);
                                break
                        }
                    }
                    if (fingers === 1) { lastTouchStart = time }
                },
                firstMove = true;
            el.addEventListener("touchstart", function(event) {
                if (target.enabled) {
                    firstMove = true;
                    fingers = event.touches.length;
                    detectDoubleTap(event)
                }
            });
            el.addEventListener("touchmove", function(event) {
                if (target.enabled) {
                    if (firstMove) {
                        updateInteraction(event);
                        if (interaction) { cancelEvent(event) }
                        startTouches = targetTouches(event.touches)
                    } else {
                        switch (interaction) {
                            case "zoom":
                                target.handleZoom(event, calculateScale(startTouches, targetTouches(event.touches)));
                                break;
                            case "drag":
                                target.handleDrag(event);
                                break
                        }
                        if (interaction) {
                            cancelEvent(event);
                            target.update()
                        }
                    }
                    firstMove = false
                }
            });
            el.addEventListener("touchend", function(event) {
                if (target.enabled) {
                    fingers = event.touches.length;
                    updateInteraction(event)
                }
            })
        };
        return PinchZoom
    };
    if (typeof define !== "undefined" && define.amd) { define(["jquery"], function($) { return definePinchZoom($) }) } else {
        window.RTP = window.RTP || {};
        window.RTP.PinchZoom = definePinchZoom(window.$)
    }
}).call(this);

/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
(function() {
    'use strict';

    var variables = {
        store_entity: 'ciamaritima',
        newsletter_sigla: 'NS',
        product_page_class: 'produto',
        prateleira_class: '.pat-vitrine'
    }

    var navdrawerContainer = $('.navdrawer-container');
    var body = document.body;
    var appbarElement = $('.app-bar');
    var menuBtn = $('.menu');
    var closeMenuBtn = $('.close-menu');
    var main = $('main');

    function closeMenu() {
        // body.removeClass('open');
        // appbarElement.removeClass('open');
        navdrawerContainer.removeClass('open');
    }

    function toggleMenu() {
        // body.toggleClass('open');
        // appbarElement.toggleClass('open');
        navdrawerContainer.toggleClass('open');
        navdrawerContainer.addClass('opened');
    }

    main.livequery('click', closeMenu);
    closeMenuBtn.livequery('click', closeMenu);
    menuBtn.livequery('click', toggleMenu);
    // navdrawerContainer.livequery('click', function (event) {
    //   if (event.target.nodeName === 'A' || event.target.nodeName === 'LI') {
    //     closeMenu();
    //   }
    // });

    // Check to make sure service workers are supported in the current browser,
    // and that the current page is accessed from a secure origin. Using a
    // service worker from an insecure origin will trigger JS console errors. See
    // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features

    // Your custom JavaScript goes here

    // Open Search
    var searchdrawerContainer = $('.searchdrawer-container');
    var closeSearchBtn = $('.close-search');
    var searchBtn = $('.search-button');
    var emptyBtn = $('.searchdrawer-empty');

    function closeSearch() {
        searchdrawerContainer.removeClass('open');
    }

    function toggleSearch() {
        searchdrawerContainer.toggleClass('open');
        searchdrawerContainer.addClass('opened');
        searchdrawerContainer.find('input').focus();
    }
    main.livequery('click', closeSearch);
    closeSearchBtn.livequery('click', closeSearch);
    searchBtn.livequery('click', toggleSearch);
    emptyBtn.livequery('click', function() {
        searchdrawerContainer.find('input').value = '';
        searchdrawerContainer.find('input').focus();
    });

    var responsiveBanners = function() {
        $('.box-banner img').width('100%')
        $('.box-banner img').height('100%')
            // $('.box-banner a').addClass('menu-image clearfix')
            // $('.box-banner a').each(function(){
            //   $(this).append('<div class="menu-image__title right">'+$(this).find("img").attr("alt")+'</div>')
            // })
    }

    var goTop = function() {
        $("button.button--muted.button_block").livequery('click', function() {
            $("html, body").animate({ scrollTop: 0 }, "slow");
            return false;
        });
    }

    var sendEmailNewLetter = function() {
        $('.form-newsletter--input[type="button"]').livequery('click', function() {
            // validaÃƒÂ§ÃƒÂ£o email
            var emailInvalido, verifica;
            emailInvalido = ["gail.com", "gmil.com", "gmal.com", "gmai.com", "gamail.com", "gamil.com", "gmail.com.br", "gail.com.br", "gmil.com.br", "gmal.com.br", "gmai.com.br", "gamail.com.br", "gamil.com.br", "hotmail.com.br", "otmail.com", "htmail.com", "homail.com", "hotail.com", "hotmil.com", "hotmal.com", "hotmai.com", "rotmail.com", "hitmail.com", "hotimail.com", "otmail.com.br", "htmail.com.br", "homail.com.br", "hotail.com.br", "hotmil.com.br", "hotmal.com.br", "hotmai.com.br", "rotmail.com.br", "hitmail.com.br", "hotimail.com.br", "outlook.com.br", "outlok.com.br", "outloook.com.br", "autlook.com.br", "outlok.com", "outloook.com", "autlook.com", "yaho.com.br", "yahooo.com.br", "yaahoo.com.br", "iahoo.com.br", "yaho.com", "yahooo.com", "yaahoo.com", "iahoo.com", "iclaud.com", "iclaud.com.br", "icloud.com.br", "terrra.com.br", ".cm.br", ".com.bn", ".com.bt", ".co.br", ".om.br"];
            verifica = $('.form-newsletter--input.enviar').val();
            verifica = verifica.split('@')[1];
            console.log(verifica);
            var invalido = (emailInvalido.indexOf(verifica) > -1);
            if (invalido == true) {
                alert('Digit a valid e-mail');
                return false
            }

            var data = {
                email: $('.form-newsletter--input[type="text"]').val(),
                campanha: "mobile"
            }
            $.ajax({
                headers: {
                    "Accept": "application/json; charset=utf-8",
                    "Content-Type": "application/json; charset=utf-8"
                },
                //jsonp: "callback",
                //dataType: "jsonp",*/
                //contentType: 'application/json; charset=utf-8',
                enctype: 'multipart/form-data',
                processData: false,
                contentType: false,
                data: JSON.stringify(data),
                type: 'PUT',
                url: '//api.vtexcrm.com.br/' + variables.store_entity + '/dataentities/' + variables.newsletter_sigla + '/documents'
            }).success(function(data) {
                console.log(data)
                alert("Success")
            });
        })
    }

    var dropdownLateral = function() {
        // Dropdown toggle
        $('.dropdown-toggle').livequery('click', function() {
            $(this).next('.dropdown').toggle();
        });

        $(document).livequery('click', function(e) {
            var target = e.target;
            if (!$(target).is('.dropdown-toggle') && !$(target).parents().is('.dropdown-toggle')) {
                $('.dropdown').hide();
            }
        });

    }

    var breadCrumbFix = function() {
        $('.bread-crumb').addClass('breadcrumbs')
        $('.bread-crumb a').addClass('breadcrumbs__link')
        $('a[title="ValFrance-Mobile"]').text("home")
        var firstTextBreadCrumb = $('.bread-crumb a:eq(0)').text("Home");
        $('.bread-crumb a:eq(0)').text("");
        $('.bread-crumb a:eq(0)').append('<i class="color--primary fa fa-home"></i> Home')
    }

    var orderFix = function() {
        $('.sub').last().remove()
        $('.previous').livequery(function() {
            $(this).text("<<")
        })
        $('.next').livequery(function() {
            $(this).text(">>")
        })
    }

    var thumbsProduct = function() {
        $('.thumbs').wrap('<div class="g-medium--1 g-medium--last g-wide--1 g-wide--last thumbs_for_products"></div>')
        $('.thumbs img').each(function() {
            $(this).attr('src', $(this).attr('src').replace('55-55', '100-100'))
        })
        $('.thumbs_for_products').insertBefore($('.productImage').parent())
            // $('.checkboxes').before($('.thumbs_for_products'))
        $('.checkboxes .topic').addClass('collapse-menu')
        $('.checkboxes .specification').addClass('collapse-menu--title')
        $('.checkboxes .skuList').addClass('collapse-menu--content')

        $('.collapse-menu--title').livequery('click', function() {
            $(this).parent('.collapse-menu').toggleClass('open');
            $(this).next(".collapse-menu--content").slideToggle(200);
            $(this).siblings().next(".collapse-menu--content").slideUp(200);
        });

        $('.select.skuList').livequery(function() {
            $(this).find('label').livequery('click', function() {
                $(this).addClass('sku-picked');
                $(this).siblings('.sku-picked').removeClass('sku-picked');
            });
        });

        $('.zoomPad').livequery(function() {
            new RTP.PinchZoom($(this).find('#image-main'), {});
            $(this).find('.zoomPup').remove()
            $(this).find('.zoomWindow').remove()
            $(this).find('.zoomWrapper').remove()
            $(this).find('.zoomPreload').remove()
        });

        // $('.share--whatsapp a').attr("href", "whatsapp://send?text=Acesse o nosso site:"+window.location.href)
    }

    var continueReading = function() {
        $('.pat-vitrine').livequery(function() {
            $(this).find('li .product-title a').each(function() {
                if ($(this).text().length > 36) {
                    $(this).text($(this).text().substring(0, 37) + '...')
                }

            })
        })
    }

    var menuCorrection = function() {
        //$.each($('.Color').find('h3'), function(i, val) {
        //    $(this).find('h3');
        //    $(".Color h3, .Color ul").wrapAll("<li class='departamento Color'></li>");
        //    $(this).remove();
        //});

        //$(".departamento.Color ul").addClass("dropdown").before("<a href='#' class='dropdown-toggle'>Cor</a>")
        //$.each($('.Size').find('h3'), function(i, val) {
        //   $(this).find('h3');
        //    $(".Size h3, .Size ul").wrapAll("<li class='departamento Size'></li>");
        //    $(this).remove();
        //});

        //$(".departamento.Size ul").addClass("dropdown").before("<a href='#' class='dropdown-toggle'>Size</a>")

        $.each($('.menu-departamento').find('h3'), function(i, val) {
            var depName = $(this).attr('class') ? $(this).attr('class').split(' ')[0] : $(this).html().replace(' ', '-');
            console.log($(".menu-departamento ul." + depName).find('li').length);
            if ($(".menu-departamento ul." + depName).find('li').length == 0) {
                $(".menu-departamento ." + depName).find('ul').remove();
            } else {
                $(".menu-departamento ul." + depName).prepend('<li><a href="' + $(this).find('a').attr('href') + '">Todos ' + $(this).find('a').text() + '</a></li>');
                $(this).find('a').addClass('dropdown-toggle').attr('href', "#");
            }

            $(".menu-departamento ." + depName).wrapAll("<li class='departamento " + depName + "'></li>");
            var fieldA = $(this).find('a');
            $(this).before(fieldA);
            $(this).remove();
        });

        /*$('li.departamento').each(function(i, val) {
            console.log($this);
            console.log($(this).length)
            if ($(this).length == 0) {
                console.log($(this).length);
                $(this).hide();
            }
        });*/

        $("li.departamento").livequery(function() {
            if ($(this).find('a').length <= 0) {
                $(this).hide();
            }
        })

        $(".menu-departamento ul").addClass("dropdown");


    }

    var precoProduto = function() {
        $(".skuBestPrice").livequery(function() {
            if ($(".skuListPrice").length >= 1) {
                var de = "DE: " + $(".skuListPrice").text();
            } else {
                var de = "";
            }
            if ($(".skuBestPrice").length >= 1) {
                var por = $(".skuBestPrice").text();
            } else {
                var por = "";
            }
            if ($(".skuBestInstallmentNumber").length >= 1) {
                var parcelamento = $(".skuBestInstallmentNumber").text();
                var valorParcelamento = $(".skuBestInstallmentValue").text();
            } else {
                var parcelamento = "";
                var valorParcelamento = "";
            }
            $(".plugin-preco").text("")

            $(".plugin-preco").append("<div class='valor-de'>" + de + " </div><div class='valor-por'>To: " + por + " </div><div class='valor-ou'>Or " + parcelamento + " " + valorParcelamento + "</div>")
        })

    }

    var instagramOwl = function() {
        if ($("#owl-demo").length == 0) {
            return false;
        }
        $("#owl-demo").owlCarousel({

            autoPlay: 3000, //Set AutoPlay to 3 seconds

            items: 5,
            //  itemsDesktop : [1199,4],
            //  itemsDesktopSmall : [100,4],
            itemsDesktop: false,
            responsive: true,
            itemsCustom: [40, 1]

        });
    };

    var reorderScripts = function() {
        if (!$('body').hasClass('account') && !$('body').hasClass('orders')) {
            return false;
        }
        // $('<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.1.1/css/bootstrap.min.css" />').appendTo('head');
        $('<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min.js" type="text/javascript"></script>').appendTo('head');
        $("main link").insertBefore('head meta:last');
        $('link[href="//io.vtex.com.br/front-libs/bootstrap/2.3.2/css/bootstrap.min.css"]').remove();
        $("link[href=\"//io.vtex.com.br/front-libs/font-awesome/3.2.1/css/font-awesome.min.css\"]").remove();
        $('#orders-content').livequery(function() {
            $(this).removeClass('container');
        });
        $('[href="#editar-perfil"]').on('click', function() {
            $('.form-business-data-name a[data="off"]').html('Incluir dados de pessoa juridica');
        });
        $('.form-business-data-name a[data="off"]').livequery(function() {
            $(this).html('Incluir dados de pessoa juridica');
        });
        $('.form-business-data-name a[data="on"]').livequery(function() {
            $(this).html('Nao usar dados de pessoa juridica');
        });
        $('.modal.fade').appendTo('body')
    }

    var tagDiscount = function() {
        function calculateDiscount(parent, oldPriceClass, newPriceClass) {
            var de = parent.find(oldPriceClass).text().replace(",", ".").split('R$')[1];
            var por = parent.find(newPriceClass).text().replace(",", ".").split('R$')[1];
            de = parseFloat(de);
            por = parseFloat(por);
            var divisao = (por / de) - 1.00;
            divisao = parseFloat(divisao).toFixed(2).split('.')[1];
            divisao = parseInt(divisao);
            if (divisao > 0) {
                return '<div class="tag--discount">- ' + divisao + '%</div>';
            }
            return '';
        }
        $(variables.prateleira_class).find('li').livequery(function() {
            $(this).find('.box-img').append(calculateDiscount($(this), '.newPrice .de', '.newPrice .por'));
        });
        if ($('body').hasClass(variables.product_page_class)) {
            $('.productImage').append(calculateDiscount($('.plugin-preco'), '.valor-de', '.valor-por'));
        }
    }

    var fixFrete = function() {
        $('#calculoFrete .prefixo').livequery(function() {
            $(this).html($(this).html().replace('Calculate shipping value', 'CEP:'));
        });
        $('#btnFreteSimulacao').livequery(function() {
            $(this).val('Calcular');
        });
    }
    var ajusteFaq = function() {
        setTimeout(function() {
            $('.dt-floater').remove().insertBefore($("footer").find('.faqButton'));
        }, 500);
    }


    var boxContentSingle = function() {
        //$('').livequery(function(){ })
        $(".lookbook .box-content-single img").ready(function() {
            $(".lookbook .box-content-single").owlCarousel({
                autoPlay: 3000, //Set AutoPlay to 3 seconds
                items: 1,
                autoplay: true,
                responsive: true,
                navigation: true
            });
        })

    }

    $(document).ready(function() {

        $('.trigger').livequery('click', function() {
            $('.modal-wrapper').toggleClass('open');
            return false;
        });

        $('.botaoZoom').livequery('click', function() {
            if (!$(this).hasClass('active')) {
                $('#image-main').attr('src', $(this).attr('rel'));
                $('.botaoZoom.active').removeClass('active');
                $(this).addClass('active');
            }
        });

        responsiveBanners();
        goTop();
        sendEmailNewLetter();
        dropdownLateral();
        breadCrumbFix();
        orderFix();
        continueReading();
        menuCorrection();
        precoProduto();
        instagramOwl();
        boxContentSingle();
        reorderScripts();
        tagDiscount();
        ajusteFaq();
        if ($('body').hasClass(variables.product_page_class)) {
            thumbsProduct();
            fixFrete();
        }
    });

})();