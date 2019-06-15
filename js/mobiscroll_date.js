/*jslint eqeq: true, plusplus: true, undef: true, sloppy: true, vars: true, forin: true */
/*!
 * jQuery MobiScroll v2.5.1
 * http://mobiscroll.com
 *
 * Copyright 2010-2013, Acid Media
 * Licensed under the MIT license.
 *
 */
(function ($) {
    console.log("bbbbb")
    function Scroller(elem, settings) {
        console.log("bbbbb Scroller 对象构造函数(elem, settings)", elem, settings)
        var m,
            hi,
            v,
            dw,
            ww, // Window width
            wh, // Window height
            rwh,
            mw, // Modal width
            mh, // Modal height
            anim,
            debounce,
            that = this,
            ms = $.mobiscroll,
            e = elem,
            elm = $(e),
            theme,
            lang,
            s = extend({}, defaults),
            pres = {},
            warr = [],
            iv = {},
            pixels = {},
            input = elm.is('input'),
            visible = false;

        /**
        * 滚轮条是否只读
        * @param {JQuery Object} wh - 当前滚轮条的JQuery对象
        */
        function isReadOnly(wh) {
            if ($.isArray(s.readonly)) {
                var i = $('.dwwl', dw).index(wh);
                return s.readonly[i];
            }
            return s.readonly;
        }
        
        /**
        * 在滚轮页面显示的时候创建滚轮条，
        * @param {Number} i - 滚轮编号，如 0, 1, 2, 3, 4
        */
        function generateWheelItems(i) {
            console.log("bbbbb generateWheelItems(i)", i)
            var html = '<div class="dw-bf">',
                l = 1,
                j;

            for (j in warr[i]) {
                if (l % 20 == 0) {
                    html += '</div><div class="dw-bf">';
                }
                html += '<div class="dw-li dw-v" data-val="' + j + '" style="height:' + hi + 'px;line-height:' + hi + 'px;">'+
                '<div class="dw-i">' + warr[i][j] + '</div></div>';
                l++;
            }
            html += '</div>';
            return html;
        }

        function setGlobals(t) {
            console.log("bbbbb setGlobals(t)", t)
            min = $('.dw-li', t).index($('.dw-v', t).eq(0));
            max = $('.dw-li', t).index($('.dw-v', t).eq(-1));
            index = $('.dw-ul', dw).index(t);
            h = hi;
            inst = that;
        }

        /**
        * 时间变化时，格式化头部描述内容
        * @param {Number} v - 时间
        */
        function formatHeader(v) {
            console.log("bbbbb formatHeader(v)", v)
            var t = s.headerText;
            return t ? (typeof t === 'function' ? t.call(e, v) : t.replace(/\{value\}/i, v)) : '';
        }

        /**
        * 滚轮初始化的时候和每次页面展示的时候，获取滚轮的初始设置时间。
        */
        function read() {
            that.temp = ((input && that.val !== null && that.val != elm.val()) || that.values === null) ? s.parseValue(elm.val() || '', that) : that.values.slice(0);
            console.log("bbbbb read 读取日期数据(that.temp)", that.temp)
            that.setValue(true);
        }

        function scrollToPos(time, index, manual, dir, orig) {
            console.log("bbbbb scrollToPos(time, index, manual, dir, orig)", time, index, manual, dir, orig)
            // Call validation event
            if (event('validate', [dw, index, time]) !== false) {
                console.log("bbbbb scrollToPos 设置滚轮到指定位置")
                // Set scrollers to position
                $('.dw-ul', dw).each(function (i) {
                    var t = $(this),
                        cell = $('.dw-li[data-val="' + that.temp[i] + '"]', t),
                        cells = $('.dw-li', t),
                        v = cells.index(cell),
                        l = cells.length,
                        sc = i == index || index === undefined;
                    
                    // Scroll to a valid cell
                    if (!cell.hasClass('dw-v')) {
                        var cell1 = cell,
                            cell2 = cell,
                            dist1 = 0,
                            dist2 = 0;
                        
                        while (v - dist1 >= 0 && !cell1.hasClass('dw-v')) {
                            dist1++;
                            cell1 = cells.eq(v - dist1);
                        }

                        while (v + dist2 < l && !cell2.hasClass('dw-v')) {
                            dist2++;
                            cell2 = cells.eq(v + dist2);
                        }
                        
                        // If we have direction (+/- or mouse wheel), the distance does not count
                        if (((dist2 < dist1 && dist2 && dir !== 2) || !dist1 || (v - dist1 < 0) || dir == 1) && cell2.hasClass('dw-v')) {
                            cell = cell2;
                            v = v + dist2;
                        } else {
                            cell = cell1;
                            v = v - dist1;
                        }
                    }
                    
                    if (!(cell.hasClass('dw-sel')) || sc) {
                        // Set valid value
                        that.temp[i] = cell.attr('data-val');

                        // Add selected class to cell
                        $('.dw-sel', t).removeClass('dw-sel');
                        cell.addClass('dw-sel');

                        // Scroll to position
                        //that.scroll(t, i, v, time);
                        that.scroll(t, i, v, sc ? time : 0.1, sc ? orig : undefined);
                    }
                });
                
                // Reformat value if validation changed something
                that.change(manual);
            }
        
        }

        function position(check) {
            console.log("bbbbb position(check)", check)
            if (s.display == 'inline' || (ww === $(window).width() && rwh === $(window).height() && check)) {
                return;
            }
            
            var w,
                l,
                t,
                aw, // anchor width
                ah, // anchor height
                ap, // anchor position
                at, // anchor top
                al, // anchor left
                arr, // arrow
                arrw, // arrow width
                arrl, // arrow left
                scroll,
                totalw = 0,
                minw = 0,
                st = $(window).scrollTop(),
                wr = $('.dwwr', dw),
                d = $('.dw', dw),
                css = {},
                anchor = s.anchor === undefined ? elm : s.anchor;
            
            ww = $(window).width();
            rwh = $(window).height();
            wh = window.innerHeight; // on iOS we need innerHeight
            wh = wh || rwh;
            
            if (/modal|bubble/.test(s.display)) {
                $('.dwc', dw).each(function () {
                    w = $(this).outerWidth(true);
                    totalw += w;
                    minw = (w > minw) ? w : minw;
                });
                w = totalw > ww ? minw : totalw;
                wr.width(w);
            }
            
            mw = d.outerWidth();
            mh = d.outerHeight(true);
            
            if (s.display == 'modal') {
                l = (ww - mw) / 2;
                t = st + (wh - mh) / 2;
            } else if (s.display == 'bubble') {
                scroll = true;
                arr = $('.dw-arrw-i', dw);
                ap = anchor.offset();
                at = ap.top;
                al = ap.left;

                // horizontal positioning
                aw = anchor.outerWidth();
                ah = anchor.outerHeight();
                l = al - (d.outerWidth(true) - aw) / 2;
                l = l > (ww - mw) ? (ww - (mw + 20)) : l;
                l = l >= 0 ? l : 20;
                
                // vertical positioning
                t = at - mh; //(mh + 3); // above the input
                if ((t < st) || (at > st + wh)) { // if doesn't fit above or the input is out of the screen
                    d.removeClass('dw-bubble-top').addClass('dw-bubble-bottom');
                    t = at + ah;// + 3; // below the input
                } else {
                    d.removeClass('dw-bubble-bottom').addClass('dw-bubble-top');
                }

                //t = t >= st ? t : st;
                
                // Calculate Arrow position
                arrw = arr.outerWidth();
                arrl = al + aw / 2 - (l + (mw - arrw) / 2);

                // Limit Arrow position to [0, pocw.width] intervall
                $('.dw-arr', dw).css({ left: arrl > arrw ? arrw : arrl });
            } else {
                css.width = '100%';
                if (s.display == 'top') {
                    t = st;
                } else if (s.display == 'bottom') {
                    t = st + wh - mh;
                }
            }
            
            css.top = t < 0 ? 0 : t;
            css.left = l;
            d.css(css);
            
            // If top + modal height > doc height, increase doc height
            $('.dw-persp', dw).height(0).height(t + mh > $(document).height() ? t + mh : $(document).height());
            
            // Scroll needed
            if (scroll && ((t + mh > st + wh) || (at > st + wh))) {
                $(window).scrollTop(t + mh - wh);
            }
        }
        
        function testTouch(e) {
            console.log("bbbbb testTouch(e)", e)
            if (e.type === 'touchstart') {
                touch = true;
                setTimeout(function () {
                    touch = false; // Reset if mouse event was not fired
                }, 500);
            } else if (touch) {
                touch = false;
                return false;
            }
            return true;
        }

        function event(name, args) {
            console.log("bbbbb 动态调用函数", name, "(args)", args)
            var ret;
            args.push(that);
            $.each([theme.defaults, pres, settings], function (i, v) {
                if (v[name]) { // Call preset event
                    ret = v[name].apply(e, args);
                }
            });
            return ret;
        }

        function plus(t) {
            console.log("bbbbb plus(t)", t)
            var p = +t.data('pos'),
                val = p + 1;
            calc(t, val > max ? min : val, 1, true);
        }

        function minus(t) {
            console.log("bbbbb minus(t)", t)
            var p = +t.data('pos'),
                val = p - 1;
            calc(t, val < min ? max : val, 2, true);
        }

        // Public functions

        /**
        * Enables the scroller and the associated input.
        */
        that.enable = function () {
            console.log("bbbbb enable()")
            s.disabled = false;
            if (input) {
                elm.prop('disabled', false);
            }
        };

        /**
        * Disables the scroller and the associated input.
        */
        that.disable = function () {
            console.log("bbbbb disable()")
            s.disabled = true;
            if (input) {
                elm.prop('disabled', true);
            }
        };

        /**
        * Scrolls target to the specified position
        * @param {Object} t - Target wheel jQuery object.
        * @param {Number} index - Index of the changed wheel.
        * @param {Number} val - Value.
        * @param {Number} time - Duration of the animation, optional.
        * @param {Number} orig - Original value.
        */
        that.scroll = function (t, index, val, time, orig) {
            console.log("bbbbb scroll(t, index, val, time, orig)", t, index, val, time, orig)
            function getVal(t, b, c, d) {
                return c * Math.sin(t / d * (Math.PI / 2)) + b;
            }

            function ready() {
                console.log("bbbbb ready()")
                clearInterval(iv[index]);
                delete iv[index];
                t.data('pos', val).closest('.dwwl').removeClass('dwa');
            }
            
            var px = (m - val) * hi,
                i;
            
            if (px == pixels[index] && iv[index]) {
                return;
            }
            
            if (time && px != pixels[index]) {
                // Trigger animation start event
                event('onAnimStart', [dw, index, time]);
            }
            
            pixels[index] = px;
            
            t.attr('style', (prefix + '-transition:all ' + (time ? time.toFixed(3) : 0) + 's ease-out;') + (has3d ? (prefix + '-transform:translate3d(0,' + px + 'px,0);') : ('top:' + px + 'px;')));
            
            if (iv[index]) {
                ready();
            }
            
            if (time && orig !== undefined) {
                i = 0;
                t.closest('.dwwl').addClass('dwa');
                iv[index] = setInterval(function () {
                    i += 0.1;
                    t.data('pos', Math.round(getVal(i, orig, val - orig, time)));
                    if (i >= time) {
                        ready();
                    }
                }, 100);
            } else {

                t.data('pos', val);
            }
        };
        
        /**
        * Gets the selected wheel values, formats it, and set the value of the scroller instance.
        * If input parameter is true, populates the associated input element.
        * @param {Boolean} sc - Scroll the wheel in position.
        * @param {Boolean} fill - Also set the value of the associated input element. Default is true.
        * @param {Number} time - Animation time
        * @param {Boolean} temp - If true, then only set the temporary value.(only scroll there but not set the value)
        */
        that.setValue = function (sc, fill, time, temp) {
            console.log("bbbbb 为setValue(sc, fill, time, temp)", sc, fill, time, temp)
            if (!$.isArray(that.temp)) {
                that.temp = s.parseValue(that.temp + '', that);
            }
            
            if (visible && sc) {
                scrollToPos(time);
            }
            
            v = s.formatResult(that.temp);
            
            if (!temp) {
                that.values = that.temp.slice(0);
                that.val = v;
            }

            console.log("bbbbb 赋值(that.values, that.val)", that.values, that.val)

            if (fill) {
                if (input) {
                    elm.val(v).trigger('change');
                }
            }
        };
        
        that.getValues = function () {
            console.log("bbbbb getValues()")
            var ret = [],
                i;
            
            for (i in that._selectedValues) {
                ret.push(that._selectedValues[i]);
            }
            return ret;
        };

        /**
        * Checks if the current selected values are valid together.
        * In case of date presets it checks the number of days in a month.
        * @param {Number} time - Animation time
        * @param {Number} orig - Original value
        * @param {Number} i - Currently changed wheel index, -1 if initial validation.
        * @param {Number} dir - Scroll direction
        */
        that.validate = function (i, dir, time, orig) {
            console.log("bbbbb that.validate(i, dir, time, orig)", i, dir, time, orig)
            scrollToPos(time, i, true, dir, orig);
        };

        /**
        *
        */
        that.change = function (manual) {
            console.log("bbbbb change(manual)", manual)
            v = s.formatResult(that.temp);
            if (s.display == 'inline') {
                that.setValue(false, manual);
            } else {
                $('.dwv', dw).html(formatHeader(v));
            }

            if (manual) {
                event('onChange', [v]);
            }
        };
        
        /**
        * Return true if the scroller is currently visible.
        */
        that.isVisible = function () {
            return visible;
        };
        
        /**
        *
        */
        that.tap = function (el, handler) {
            console.log("bbbbb tap(el, handler)", el, handler)
            var startX,
                startY;
            
            if (s.tap) {
                el.bind('touchstart', function (e) {
                    console.log("bbbbb 事件 touchstart (e)", e)
                    e.preventDefault();
                    startX = getCoord(e, 'X');
                    startY = getCoord(e, 'Y');
                }).bind('touchend', function (e) {
                    console.log("bbbbb 事件 touchend (e)", e)
                    // If movement is less than 20px, fire the click event handler
                    if (Math.abs(getCoord(e, 'X') - startX) < 20 && Math.abs(getCoord(e, 'Y') - startY) < 20) {
                        handler.call(this, e);
                    }
                    tap = true;
                    setTimeout(function () {
                        tap = false;
                    }, 300);
                });
            }
            
            el.bind('click', function (e) {
                console.log("bbbbb 事件 click (e)", e)
                if (!tap) {
                    // If handler was not called on touchend, call it on click;
                    handler.call(this, e);
                }
            });
            
        };
        
        /**
        * 显示滚轮页面
        * @param {Boolean} prevAnim - Prevent animation if true
        */
        that.show = function (prevAnim) {
            console.log("############bbbbb show(prevAnim)#########", prevAnim)
            if (s.disabled || visible) {
                return false;
            }

            if (s.display == 'top') {
                anim = 'slidedown';
            }

            if (s.display == 'bottom') {
                anim = 'slideup';
            }

            // Parse value from input
            read();

            event('onBeforeShow', [dw]);

            // Create wheels
            console.log("############bbbbb that.show 创建滚轮html #########")
            var l = 0,
                i,
                label,
                mAnim = '';

            if (anim && !prevAnim) {
                mAnim = 'dw-' + anim + ' dw-in';
            }

            // Create wheels containers
            var html = '<div class="dw-trans ' + s.theme + ' dw-' + s.display + '">' + 
                        (s.display == 'inline' ? '<div class="dw dwbg dwi"><div class="dwwr">' : '<div class="dw-persp">' + 
                        '<div class="dwo"></div><div class="dw dwbg ' + mAnim +'">'+
                        '<div class="dw-arrw"><div class="dw-arrw-i"><div class="dw-arr"></div></div></div><div class="dwwr">' + 
                        (s.headerText ? '<div class="dwv"></div>' : ''));
            
            for (i = 0; i < s.wheels.length; i++) {
                html += '<div class="dwc' + (s.mode != 'scroller' ? ' dwpm' : ' dwsc') + (s.showLabel ? '' : ' dwhl') + '">'+
                '<div class="dwwc dwrc"><table cellpadding="0" cellspacing="0"><tr>';

                // Create wheels
                for (label in s.wheels[i]) {
                    warr[l] = s.wheels[i][label];
                    html += '<td><div class="dwwl dwrc dwwl' + l + '">' + 
                        (s.mode != 'scroller' ? '<div class="dwwb dwwbp" style="height:' + hi + 'px;line-height:' + hi + 'px;"><span>+</span></div>'+
                        '<div class="dwwb dwwbm" style="height:' + hi + 'px;line-height:' + hi + 'px;"><span>&ndash;</span></div>' : '') + 
                        '<div class="dwl">' + label + '</div><div class="dww" style="height:' + (s.rows * hi) + 'px;min-width:' + s.width + 'px;">'+
                        '<div class="dw-ul">';

                    // Create wheel values
                    html += generateWheelItems(l);
                    html += '</div><div class="dwwo"></div></div><div class="dwwol"></div></div></td>';
                    l++;
                }
                html += '</tr></table></div></div>';
            }

            html += (s.display != 'inline' ? '<div class="dwbc' + (s.button3 ? ' dwbc-p' : '') + '"><span class="dwbw dwb-s"><span class="dwb">' + 
                    s.setText + '</span></span>' + (s.button3 ? '<span class="dwbw dwb-n"><span class="dwb">' + s.button3Text + '</span></span>' : '') + 
                    '<span class="dwbw dwb-c"><span class="dwb">' + s.cancelText + '</span></span></div></div>' : '<div class="dwcc"></div>') + 
                    '</div></div></div>';
            dw = $(html);

            console.log("############bbbbb that.show 滚轮滚到指定位置 #########")
            scrollToPos();
            
            console.log("bbbbb that.show onMarkupReady")
            event('onMarkupReady', [dw]);

            // Show
            console.log("############bbbbb that.show 展现 #########")
            if (s.display != 'inline') {
                dw.appendTo('body');
                // Remove animation class
                setTimeout(function () {
                    dw.removeClass('dw-trans').find('.dw').removeClass(mAnim);
                }, 350);
            } else if (elm.is('div')) {
                elm.html(dw);
            } else {
                dw.insertAfter(elm);
            }
            
            event('onMarkupInserted', [dw]);
            
            visible = true;
            
            // Theme init
            console.log("############bbbbb that.show Theme init #########")
            theme.init(dw, that);
            
            if (s.display != 'inline') {
                console.log("############bbbbb s.display != 'inline' #########")
                // Init buttons
                that.tap($('.dwb-s span', dw), function () {
                    if (that.hide(false, 'set') !== false) {
                        that.setValue(false, true);
                        event('onSelect', [that.val]);
                    }
                });

                that.tap($('.dwb-c span', dw), function () {
                    that.cancel();
                });

                if (s.button3) {
                    that.tap($('.dwb-n span', dw), s.button3);
                }

                // prevent scrolling if not specified otherwise
                if (s.scrollLock) {
                    dw.bind('touchmove', function (e) {
                        if (mh <= wh && mw <= ww) {
                            e.preventDefault();
                        }
                    });
                }

                // Disable inputs to prevent bleed through (Android bug)
                $('input,select,button').each(function () {
                    if (!$(this).prop('disabled')) {
                        $(this).addClass('dwtd').prop('disabled', true);
                    }
                });
                
                // Set position
                position();
                $(window).bind('resize.dw', function () {
                    console.log("bbbbb 事件 resize.dw")
                    // Sometimes scrollTop is not correctly set, so we wait a little
                    clearTimeout(debounce);
                    debounce = setTimeout(function () {
                        position(true);
                    }, 100);
                });
            }
            
            // Events
            dw.delegate('.dwwl', 'DOMMouseScroll mousewheel', function (e) {
                console.log("bbbbb dw.delegate('.dwwl', 'DOMMouseScroll mousewheel', function (e)", e);
                if (!isReadOnly(this)) {
                    e.preventDefault();
                    e = e.originalEvent;
                    var delta = e.wheelDelta ? (e.wheelDelta / 120) : (e.detail ? (-e.detail / 3) : 0),
                        t = $('.dw-ul', this),
                        p = +t.data('pos'),
                        val = Math.round(p - delta);
                    setGlobals(t);
                    calc(t, val, delta < 0 ? 1 : 2);
                }
            }).delegate('.dwb, .dwwb', START_EVENT, function (e) {
                console.log("bbbbb delegate('.dwb, .dwwb', START_EVENT, function (e)", e);
                // Active button
                $(this).addClass('dwb-a');
            }).delegate('.dwwb', START_EVENT, function (e) {
                console.log("bbbbb delegate('.dwwb', START_EVENT, function (e)", e);
                e.stopPropagation();
                e.preventDefault();
                var w = $(this).closest('.dwwl');
                if (testTouch(e) && !isReadOnly(w) && !w.hasClass('dwa')) {
                    click = true;
                    // + Button
                    var t = w.find('.dw-ul'),
                        func = $(this).hasClass('dwwbp') ? plus : minus;
                    
                    setGlobals(t);
                    clearInterval(timer);
                    timer = setInterval(function () { func(t); }, s.delay);
                    func(t);
                }
            }).delegate('.dwwl', START_EVENT, function (e) {
                console.log("bbbbb delegate('.dwwl', START_EVENT, function (e)", e);
                // Prevent scroll
                e.preventDefault();
                // Scroll start
                if (testTouch(e) && !move && !isReadOnly(this) && !click) {
                    move = true;
                    $(document).bind(MOVE_EVENT, onMove);
                    target = $('.dw-ul', this);
                    scrollable = s.mode != 'clickpick';
                    pos = +target.data('pos');
                    setGlobals(target);
                    moved = iv[index] !== undefined; // Don't allow tap, if still moving
                    start = getCoord(e, 'Y');
                    startTime = new Date();
                    stop = start;
                    that.scroll(target, index, pos, 0.001);
                    if (scrollable) {
                        target.closest('.dwwl').addClass('dwa');
                    }
                }
            });
            
            event('onShow', [dw, v]);
            console.log("############bbbbb show 结束 #########")
        };
        
        /**
        * Hides the scroller instance.
        */
        that.hide = function (prevAnim, btn) {
            console.log("bbbbb Scroller hide(prevAnim, btn)", prevAnim, btn)
            // If onClose handler returns false, prevent hide
            if (!visible || event('onClose', [v, btn]) === false) {
                return false;
            }

            // Re-enable temporary disabled fields
            $('.dwtd').prop('disabled', false).removeClass('dwtd');
            elm.blur();

            // Hide wheels and overlay
            if (dw) {
                console.log("bbbbb Scroller 隐藏滚轮和overlay")
                if (s.display != 'inline' && anim && !prevAnim) {
                    dw.addClass('dw-trans').find('.dw').addClass('dw-' + anim + ' dw-out');
                    setTimeout(function () {
                        dw.remove();
                        dw = null;
                    }, 350);
                } else {
                    dw.remove();
                    dw = null;
                }
                visible = false;
                pixels = {};
                // Stop positioning on window resize
                $(window).unbind('.dw');
            }
        };

        /**
        * Cancel and hide the scroller instance.
        */
        that.cancel = function () {
            console.log("bbbbb cancel()")
            if (that.hide(false, 'cancel') !== false) {
                event('onCancel', [that.val]);
            }
        };

        /**
        * 滚轮初始化
        */
        that.init = function (ss) {
            console.log("bbbbb Scroller 对象初始化 init(ss)", ss)
            
            // Get theme defaults
            theme = extend({ defaults: {}, init: empty }, ms.themes[ss.theme || s.theme]);

            // Get language defaults
            lang = ms.i18n[ss.lang || s.lang];

            extend(settings, ss); // Update original user settings
            extend(s, theme.defaults, lang, settings);

            that.settings = s;
            
            // Unbind all events (if re-init)
            elm.unbind('.dw');

            var preset = ms.presets[s.preset];
            
            if (preset) {
                console.log("bbbbb Scroller 调用 preset 函数")
                pres = preset.call(e, that);
                console.log("bbbbb Scroller 调用 preset 返回(pres)", pres)
                extend(s, pres, settings); // Load preset settings
                extend(methods, pres.methods); // Extend core methods
            }
            
            console.log("bbbbb Scroller.init 内调用 preset 之后(s)", s)

            // Set private members
            m = Math.floor(s.rows / 2);
            hi = s.height;
            anim = s.animate;

            if (elm.data('dwro') !== undefined) {
                e.readOnly = bool(elm.data('dwro'));
            }

            if (visible) {
                that.hide();
            }
            
            console.log("bbbbb Scroller.init 判断显示方式是inline 还是 modal/top/bottom/bubble")
            if (s.display == 'inline') {
                that.show();
            } else {
                read();
                if (input && s.showOnFocus) {
                    // Set element readonly, save original state
                    elm.data('dwro', e.readOnly);
                    e.readOnly = true;
                    // Init show datewheel
                    elm.bind('focus.dw', function () {
                        console.log("bbbbb elm.bind('focus.dw') that.show");
                        that.show(); 
                    });
                }
            }

            console.log("---------bbbbb Scroller 对象初始化完毕------------")
        };
        
        that.trigger = function (name, params) {
            console.log("bbbbb trigger(name, params)", name, params)
            return event(name, params);
        };
        
        that.values = null;
        that.val = null;
        that.temp = null;
        that._selectedValues = {}; // [];

        that.init(settings);
    }

    function testProps(props) {
        var i;
        for (i in props) {
            if (mod[props[i]] !== undefined) {
                return true;
            }
        }
        return false;
    }

    function testPrefix() {
        var prefixes = ['Webkit', 'Moz', 'O', 'ms'],
            p;

        for (p in prefixes) {
            if (testProps([prefixes[p] + 'Transform'])) {
                return '-' + prefixes[p].toLowerCase();
            }
        }
        return '';
    }

    function getInst(e) {
        console.log("bbbbb getInst(e)")
        return scrollers[e.id];
    }
    
    function getCoord(e, c) {
        console.log("bbbbb getCoord(e, c)", e, c)
        var org = e.originalEvent,
            ct = e.changedTouches;
        return ct || (org && org.changedTouches) ? (org ? org.changedTouches[0]['page' + c] : ct[0]['page' + c]) : e['page' + c];

    }

    function bool(v) {
        return (v === true || v == 'true');
    }

    function constrain(val, min, max) {
        console.log("bbbbb constrain(val, min, max)",val, min, max);
        val = val > max ? max : val;
        val = val < min ? min : val;
        return val;
    }
    
    function calc(t, val, dir, anim, orig) {
        console.log("bbbbb calc(t, val, dir, anim, orig)", t, val, dir, anim, orig)
        val = constrain(val, min, max);

        var cell = $('.dw-li', t).eq(val),
            o = orig === undefined ? val : orig,
            idx = index,
            time = anim ? (val == o ? 0.1 : Math.abs((val - o) * 0.1)) : 0;

        // Set selected scroller value
        inst.temp[idx] = cell.attr('data-val');
        
        inst.scroll(t, idx, val, time, orig);
        
        setTimeout(function () {
            // Validate
            inst.validate(idx, dir, time, orig);
        }, 10);
    }

    //滚轮初始化
    function init(that, method) {
        console.log("bbbbb 滚轮初始化 init(that, method)")
        if (typeof method === 'object') {
            return methods.init.call(that, method);
        }
        return that;
    }

    var scrollers = {},
        timer,
        empty = function () { },
        h,
        min,
        max,
        inst, // Current instance
        date = new Date(),
        uuid = date.getTime(),
        move,
        click,
        target,
        index,
        start,
        stop,
        startTime,
        pos,
        moved,
        scrollable,
        mod = document.createElement('modernizr').style,
        has3d = testProps(['perspectiveProperty', 'WebkitPerspective', 'MozPerspective', 'OPerspective', 'msPerspective']),
        prefix = testPrefix(),
        extend = $.extend,
        tap,
        touch,
        START_EVENT = 'touchstart mousedown',
        MOVE_EVENT = 'touchmove mousemove',
        END_EVENT = 'touchend mouseup',
        onMove = function (e) {
            console.log("bbbbb onMove(e)", e)
            if (scrollable) {
                e.preventDefault();
                stop = getCoord(e, 'Y');
                inst.scroll(target, index, constrain(pos + (start - stop) / h, min - 1, max + 1));
            }
            moved = true;
        },
        defaults = {
            // Options
            width: 70,
            height: 40,
            rows: 3,
            delay: 300,
            disabled: false,
            readonly: false,
            showOnFocus: true,
            showLabel: true,
            wheels: [],
            theme: '',
            headerText: '{value}',
            display: 'modal',
            mode: 'scroller',
            preset: '',
            lang: 'en-US',
            setText: 'Set',
            cancelText: 'Cancel',
            scrollLock: true,
            tap: true,
            formatResult: function (d) {
                console.log("bbbbb formatResult(d)", d)
                return d.join(' ');
            },
            parseValue: function (value, inst) {
                console.log("bbbbb parseValue(value, inst)", value, inst)
                var w = inst.settings.wheels,
                    val = value.split(' '),
                    ret = [],
                    j = 0,
                    i,
                    l,
                    v;

                for (i = 0; i < w.length; i++) {
                    for (l in w[i]) {
                        if (w[i][l][val[j]] !== undefined) {
                            ret.push(val[j]);
                        } else {
                            for (v in w[i][l]) { // Select first value from wheel
                                ret.push(v);
                                break;
                            }
                        }
                        j++;
                    }
                }
                return ret;
            }
        },

        methods = {
            //初始化方法，创建 Scroller 对象
            init: function (options) {
                console.log("bbbbb 初始化方法 methods init(options)")
                if (options === undefined) {
                    options = {};
                }

                return this.each(function () {
                    if (!this.id) {
                        uuid += 1;
                        this.id = 'scoller' + uuid;
                    }
                    
                    console.log("bbbbb 创建 Scroller 对象(id, options)", this.id)

                    scrollers[this.id] = new Scroller(this, options);
                });
            },
            enable: function () {
                console.log("bbbbb enable()")
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.enable();
                    }
                });
            },
            disable: function () {
                console.log("bbbbb disable()")
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.disable();
                    }
                });
            },
            isDisabled: function () {
                console.log("bbbbb methods isDisabled()")
                var inst = getInst(this[0]);
                if (inst) {
                    return inst.settings.disabled;
                }
            },
            isVisible: function () {
                console.log("bbbbb methods isVisible()")
                var inst = getInst(this[0]);
                if (inst) {
                    return inst.isVisible();
                }
            },
            option: function (option, value) {
                console.log("bbbbb option(option, value)", option, value)
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        var obj = {};
                        if (typeof option === 'object') {
                            obj = option;
                        } else {
                            obj[option] = value;
                        }
                        inst.init(obj);
                    }
                });
            },
            setValue: function (d, fill, time, temp) {
                console.log("bbbbb methods setValue(d, fill, time, temp)", d, fill, time, temp)
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.temp = d;
                        inst.setValue(true, fill, time, temp);
                    }
                });
            },
            getInst: function () {
                console.log("bbbbb methods getInst()")
                return getInst(this[0]);
            },
            getValue: function () {
                console.log("bbbbb methods getValue()")
                var inst = getInst(this[0]);
                if (inst) {
                    return inst.values;
                }
            },
            getValues: function () {
                console.log("bbbbb methods getValues()")
                var inst = getInst(this[0]);
                if (inst) {
                    return inst.getValues();
                }
            },
            show: function () {
                console.log("bbbbb methods show()")
                var inst = getInst(this[0]);
                if (inst) {
                    return inst.show();
                }
            },
            hide: function () {
                console.log("bbbbb methods hide()")
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.hide();
                    }
                });
            },
            destroy: function () {
                console.log("bbbbb methods destroy()")
                return this.each(function () {
                    var inst = getInst(this);
                    if (inst) {
                        inst.hide();
                        $(this).unbind('.dw');
                        delete scrollers[this.id];
                        if ($(this).is('input')) {
                            this.readOnly = bool($(this).data('dwro'));
                        }
                    }
                });
            }
        };
    
        console.log("bbbbb scrollers = ", scrollers)
        console.log("bbbbb defaults = ", defaults)
        console.log("bbbbb methods = ", methods)
    
    $(document).bind(END_EVENT, function (e) {
        console.log("bbbbb 事件 END_EVENT (move, e)", move, e)
        if (move) {
            console.log("bbbbb 事件 END_EVENT 内 move")
            var time = new Date() - startTime,
                val = constrain(pos + (start - stop) / h, min - 1, max + 1),
                speed,
                dist,
                tindex,
                ttop = target.offset().top;
        
            if (time < 300) {
                speed = (stop - start) / time;
                dist = (speed * speed) / (2 * 0.0006);
                if (stop - start < 0) {
                    dist = -dist;
                }
            } else {
                dist = stop - start;
            }
            
            tindex = Math.round(pos - dist / h);
            
            if (!dist && !moved) { // this is a "tap"
                var idx = Math.floor((stop - ttop) / h),
                    li = $('.dw-li', target).eq(idx),
                    hl = scrollable;
                
                if (inst.trigger('onValueTap', [li]) !== false) {
                    tindex = idx;
                } else {
                    hl = true;
                }
                
                if (hl) {
                    li.addClass('dw-hl'); // Highlight
                    setTimeout(function () {
                        li.removeClass('dw-hl');
                    }, 200);
                }
            }
            
            if (scrollable) {
                calc(target, tindex, 0, true, Math.round(val));
            }
            
            move = false;
            target = null;
        
            $(document).unbind(MOVE_EVENT, onMove);
        }

        if (click) {
            clearInterval(timer);
            click = false;
        }
    
        $('.dwb-a').removeClass('dwb-a');
                
    }).bind('mouseover mouseup mousedown click', function (e) { // Prevent standard behaviour on body click
        if (tap) {
            e.stopPropagation();
            e.preventDefault();
            return false;
        }
    });

    $.fn.mobiscroll = function (method) {
        //滚轮的创建
        console.log("bbbbb 创建滚轮 $.fn.mobiscroll(method)", method)
        return init(this, method);
    };

    $.mobiscroll = $.mobiscroll || {
        /**
        * Set settings for all instances.
        * @param {Object} o - New default settings.
        */
        setDefaults: function (o) {
            console.log("bbbbb setDefaults(o)", o)
            extend(defaults, o);
        },
        presets: {},
        themes: {},
        i18n: {}
    };

    console.log("bbbbb mobiscroll = ", $.mobiscroll)

    $.scroller = $.scroller || $.mobiscroll;
    $.fn.scroller = $.fn.scroller || $.fn.mobiscroll;
	$.mobiscroll.i18n.zh = $.extend($.mobiscroll.i18n.zh, {
			dateFormat: 'yyyy-mm-dd',
			dateOrder: 'yymmdd',
			dayNames: ['周日', '周一;', '周二;', '周三', '周四', '周五', '周六'],
			dayNamesShort: ['日', '一', '二', '三', '四', '五', '六'],
			dayText: '日',
			hourText: '时',
			minuteText: '分',
			monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
			monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
			monthText: '月',
			secText: '秒',
			timeFormat: 'HH:ii',
			timeWheels: 'HHii',
			yearText: '年'
		});
		$.mobiscroll.i18n.zh = $.extend($.mobiscroll.i18n.zh, {
			cancelText: '取消',
			setText: '确定',
		});
		var theme = {
			defaults: {
				dateOrder: 'Mddyy',
				mode: 'mixed',
				rows: 5,
				width: 70,
				height: 36,
				showLabel: true,
				useShortLabels: true
			}
		}
        
        console.log("bbbbb theme = ", theme)

		$.mobiscroll.themes['android-ics'] = theme;
		$.mobiscroll.themes['android-ics light'] = theme;      

})(jQuery);
