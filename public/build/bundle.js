
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.49.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\TreeViewDynamicLoad.svelte generated by Svelte v3.49.0 */

    const { console: console_1$1 } = globals;
    const file$1 = "src\\TreeViewDynamicLoad.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (1:0) <script context="module">   const _expansionState = {}
    function create_catch_block(ctx) {
    	const block = {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script context=\\\"module\\\">   const _expansionState = {}",
    		ctx
    	});

    	return block;
    }

    // (31:0) {:then}
    function create_then_block(ctx) {
    	let ul;
    	let li;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*children*/ ctx[7]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			if_block.c();
    			add_location(li, file$1, 32, 2, 725);
    			attr_dev(ul, "class", "svelte-195weo7");
    			add_location(ul, file$1, 31, 1, 717);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			if_blocks[current_block_type_index].m(li, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(31:0) {:then}",
    		ctx
    	});

    	return block;
    }

    // (68:3) {:else}
    function create_else_block_1(ctx) {
    	let span1;
    	let span0;
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			t0 = text("▶\r\n\t\t\t\t\t");
    			t1 = text(/*label*/ ctx[6]);
    			attr_dev(span0, "class", "arrow svelte-195weo7");
    			add_location(span0, file$1, 74, 5, 1636);
    			add_location(span1, file$1, 68, 4, 1523);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t0);
    			append_dev(span1, t1);

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", /*click_handler_2*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(68:3) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:3) {#if children}
    function create_if_block(ctx) {
    	let span1;
    	let span0;
    	let t1;
    	let t2;
    	let if_block1_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*treeNodeClicked*/ ctx[0] && /*treeNodeClicked*/ ctx[0].leaf === "true" && /*treeNodeClicked*/ ctx[0].NAME === /*label*/ ctx[6]) return create_if_block_2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*expanded*/ ctx[4] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			span0.textContent = "▶";
    			t1 = space();
    			if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(span0, "class", "arrow svelte-195weo7");
    			toggle_class(span0, "arrowDown", /*arrowDown*/ ctx[5]);
    			add_location(span0, file$1, 40, 5, 868);
    			add_location(span1, file$1, 34, 4, 754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);
    			append_dev(span1, t1);
    			if_block0.m(span1, null);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(span1, "click", /*click_handler_1*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*arrowDown*/ 32) {
    				toggle_class(span0, "arrowDown", /*arrowDown*/ ctx[5]);
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(span1, null);
    				}
    			}

    			if (/*expanded*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*expanded*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if_block0.d();
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(34:3) {#if children}",
    		ctx
    	});

    	return block;
    }

    // (53:5) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*label*/ ctx[6]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(53:5) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:5) {#if treeNodeClicked && treeNodeClicked.leaf === "true" && treeNodeClicked.NAME === label}
    function create_if_block_2(ctx) {
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let if_block = /*expanded*/ ctx[4] && create_if_block_3(ctx);

    	const block = {
    		c: function create() {
    			t0 = text(/*label*/ ctx[6]);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*expanded*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(42:5) {#if treeNodeClicked && treeNodeClicked.leaf === \\\"true\\\" && treeNodeClicked.NAME === label}",
    		ctx
    	});

    	return block;
    }

    // (44:6) {#if expanded}
    function create_if_block_3(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "select";
    			add_location(button, file$1, 45, 8, 1076);
    			add_location(div, file$1, 44, 7, 1061);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(44:6) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    // (57:4) {#if expanded}
    function create_if_block_1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*children*/ ctx[7];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*children, getSubTree, treeNodeClicked, loading*/ 139) {
    				each_value = /*children*/ ctx[7];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(57:4) {#if expanded}",
    		ctx
    	});

    	return block;
    }

    // (58:5) {#each children as child}
    function create_each_block(ctx) {
    	let treeviewdynamicload;
    	let updating_treeNodeClicked;
    	let updating_loading;
    	let current;

    	function treeviewdynamicload_treeNodeClicked_binding(value) {
    		/*treeviewdynamicload_treeNodeClicked_binding*/ ctx[12](value);
    	}

    	function treeviewdynamicload_loading_binding(value) {
    		/*treeviewdynamicload_loading_binding*/ ctx[13](value);
    	}

    	let treeviewdynamicload_props = {
    		tree: /*child*/ ctx[15],
    		getSubTree: /*func*/ ctx[11]
    	};

    	if (/*treeNodeClicked*/ ctx[0] !== void 0) {
    		treeviewdynamicload_props.treeNodeClicked = /*treeNodeClicked*/ ctx[0];
    	}

    	if (/*loading*/ ctx[1] !== void 0) {
    		treeviewdynamicload_props.loading = /*loading*/ ctx[1];
    	}

    	treeviewdynamicload = new TreeViewDynamicLoad({
    			props: treeviewdynamicload_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(treeviewdynamicload, 'treeNodeClicked', treeviewdynamicload_treeNodeClicked_binding));
    	binding_callbacks.push(() => bind(treeviewdynamicload, 'loading', treeviewdynamicload_loading_binding));

    	const block = {
    		c: function create() {
    			create_component(treeviewdynamicload.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(treeviewdynamicload, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const treeviewdynamicload_changes = {};
    			if (dirty & /*getSubTree*/ 8) treeviewdynamicload_changes.getSubTree = /*func*/ ctx[11];

    			if (!updating_treeNodeClicked && dirty & /*treeNodeClicked*/ 1) {
    				updating_treeNodeClicked = true;
    				treeviewdynamicload_changes.treeNodeClicked = /*treeNodeClicked*/ ctx[0];
    				add_flush_callback(() => updating_treeNodeClicked = false);
    			}

    			if (!updating_loading && dirty & /*loading*/ 2) {
    				updating_loading = true;
    				treeviewdynamicload_changes.loading = /*loading*/ ctx[1];
    				add_flush_callback(() => updating_loading = false);
    			}

    			treeviewdynamicload.$set(treeviewdynamicload_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeviewdynamicload.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeviewdynamicload.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(treeviewdynamicload, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(58:5) {#each children as child}",
    		ctx
    	});

    	return block;
    }

    // (29:16)    <p>Loading...</p>  {:then}
    function create_pending_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Loading...";
    			add_location(p, file$1, 29, 1, 688);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(29:16)    <p>Loading...</p>  {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let await_block_anchor;
    	let promise;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		blocks: [,,,]
    	};

    	handle_promise(promise = /*loading*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			await_block_anchor = empty();
    			info.block.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, await_block_anchor, anchor);
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => await_block_anchor.parentNode;
    			info.anchor = await_block_anchor;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*loading*/ 2 && promise !== (promise = /*loading*/ ctx[1]) && handle_promise(promise, info)) ; else {
    				update_await_block_branch(info, ctx, dirty);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(await_block_anchor);
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const _expansionState = {};

    function instance$2($$self, $$props, $$invalidate) {
    	let arrowDown;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TreeViewDynamicLoad', slots, []);
    	let { tree } = $$props;
    	let { treeNodeClicked } = $$props;
    	let { loading = 0 } = $$props;

    	let { getSubTree = () => {
    		
    	} } = $$props;

    	const label = tree.NAME;
    	const children = tree.children;
    	let expanded = _expansionState[label] || false;

    	const toggleExpansion = collapse => {
    		if (collapse == true) {
    			console.log(label, "Before calling subTree");
    			$$invalidate(1, loading = getSubTree(label));
    			console.log(label, "After calling subTree");
    		}

    		$$invalidate(4, expanded = _expansionState[label] = !expanded);
    		console.log(expanded, "expand");
    	};

    	const writable_props = ['tree', 'treeNodeClicked', 'loading', 'getSubTree'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<TreeViewDynamicLoad> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		alert(treeNodeClicked.NAME);
    	};

    	const click_handler_1 = () => {
    		toggleExpansion(false);
    		$$invalidate(0, treeNodeClicked = tree);
    	};

    	const func = val => getSubTree(val);

    	function treeviewdynamicload_treeNodeClicked_binding(value) {
    		treeNodeClicked = value;
    		$$invalidate(0, treeNodeClicked);
    	}

    	function treeviewdynamicload_loading_binding(value) {
    		loading = value;
    		$$invalidate(1, loading);
    	}

    	const click_handler_2 = () => {
    		toggleExpansion(true);
    		$$invalidate(0, treeNodeClicked = tree);
    	};

    	$$self.$$set = $$props => {
    		if ('tree' in $$props) $$invalidate(2, tree = $$props.tree);
    		if ('treeNodeClicked' in $$props) $$invalidate(0, treeNodeClicked = $$props.treeNodeClicked);
    		if ('loading' in $$props) $$invalidate(1, loading = $$props.loading);
    		if ('getSubTree' in $$props) $$invalidate(3, getSubTree = $$props.getSubTree);
    	};

    	$$self.$capture_state = () => ({
    		_expansionState,
    		tree,
    		treeNodeClicked,
    		loading,
    		getSubTree,
    		label,
    		children,
    		expanded,
    		toggleExpansion,
    		arrowDown
    	});

    	$$self.$inject_state = $$props => {
    		if ('tree' in $$props) $$invalidate(2, tree = $$props.tree);
    		if ('treeNodeClicked' in $$props) $$invalidate(0, treeNodeClicked = $$props.treeNodeClicked);
    		if ('loading' in $$props) $$invalidate(1, loading = $$props.loading);
    		if ('getSubTree' in $$props) $$invalidate(3, getSubTree = $$props.getSubTree);
    		if ('expanded' in $$props) $$invalidate(4, expanded = $$props.expanded);
    		if ('arrowDown' in $$props) $$invalidate(5, arrowDown = $$props.arrowDown);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*expanded*/ 16) {
    			$$invalidate(5, arrowDown = expanded);
    		}
    	};

    	return [
    		treeNodeClicked,
    		loading,
    		tree,
    		getSubTree,
    		expanded,
    		arrowDown,
    		label,
    		children,
    		toggleExpansion,
    		click_handler,
    		click_handler_1,
    		func,
    		treeviewdynamicload_treeNodeClicked_binding,
    		treeviewdynamicload_loading_binding,
    		click_handler_2
    	];
    }

    class TreeViewDynamicLoad extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			tree: 2,
    			treeNodeClicked: 0,
    			loading: 1,
    			getSubTree: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeViewDynamicLoad",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*tree*/ ctx[2] === undefined && !('tree' in props)) {
    			console_1$1.warn("<TreeViewDynamicLoad> was created without expected prop 'tree'");
    		}

    		if (/*treeNodeClicked*/ ctx[0] === undefined && !('treeNodeClicked' in props)) {
    			console_1$1.warn("<TreeViewDynamicLoad> was created without expected prop 'treeNodeClicked'");
    		}
    	}

    	get tree() {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tree(value) {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get treeNodeClicked() {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set treeNodeClicked(value) {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get getSubTree() {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set getSubTree(value) {
    		throw new Error("<TreeViewDynamicLoad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\TreeApp.svelte generated by Svelte v3.49.0 */

    const { console: console_1 } = globals;

    function create_fragment$1(ctx) {
    	let treeview;
    	let updating_treeNodeClicked;
    	let current;

    	function treeview_treeNodeClicked_binding(value) {
    		/*treeview_treeNodeClicked_binding*/ ctx[5](value);
    	}

    	let treeview_props = {
    		tree: /*tree*/ ctx[1],
    		getSubTree: /*func*/ ctx[4]
    	};

    	if (/*treeNodeClicked*/ ctx[0] !== void 0) {
    		treeview_props.treeNodeClicked = /*treeNodeClicked*/ ctx[0];
    	}

    	treeview = new TreeViewDynamicLoad({ props: treeview_props, $$inline: true });
    	binding_callbacks.push(() => bind(treeview, 'treeNodeClicked', treeview_treeNodeClicked_binding));

    	const block = {
    		c: function create() {
    			create_component(treeview.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(treeview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const treeview_changes = {};

    			if (!updating_treeNodeClicked && dirty & /*treeNodeClicked*/ 1) {
    				updating_treeNodeClicked = true;
    				treeview_changes.treeNodeClicked = /*treeNodeClicked*/ ctx[0];
    				add_flush_callback(() => updating_treeNodeClicked = false);
    			}

    			treeview.$set(treeview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(treeview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function updateTree(tree, treeData) {
    	for (let i = 0; i < treeData.length; i++) {
    		tree["children"][i] = treeData[i];
    	}
    }

    function covertToTreeDataFormat(array, status) {
    	if (status == "error") return [];
    	let treeDataFormat = [];

    	for (let i = 0; i < array.length; i++) {
    		let tempObject = {};
    		tempObject["NAME"] = array[i];
    		treeDataFormat[i] = tempObject;
    	}

    	return treeDataFormat;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TreeApp', slots, []);
    	let treeData = [];
    	let noDuplicatesArray = [];
    	let tree = { NAME: "Dogs", children: [] };
    	let fetchedData;
    	let treeNodeClicked;
    	let leafNode = {};

    	async function getSubTree(breed) {
    		// condition to set api end-points according breed call.
    		let url;

    		if (breed == "") {
    			url = "https://dog.ceo/api/breeds/list";
    		} else {
    			url = "https://dog.ceo/api/breed/" + `${breed}` + "/list";
    		}

    		console.log(url, "URL");

    		await fetch(url).then(response => response.json()).then(fetchData => {
    			fetchedData = covertToTreeDataFormat(fetchData.message, fetchData.status);
    			console.log(fetchedData, "fetchedData");

    			if (breed == "") $$invalidate(3, treeData = fetchedData); else {
    				insertToTreeData(treeData, fetchedData, breed);
    				console.log(tree, "TREE");
    				console.log(treeData, "NAMES");
    			}

    			return 1;
    		}).catch(error => {
    			console.log(error);
    			return [];
    		});
    	}

    	onMount(() => {
    		getSubTree("");
    	});

    	function removeDuplicates(array) {
    		noDuplicatesArray = array.reduce(
    			(finalarray, current) => {
    				let obj = finalarray.find(item => item.ID === current.ID);
    				if (obj) return finalarray;
    				return finalarray.concat([current]);
    			},
    			[]
    		);

    		return noDuplicatesArray;
    	}

    	function insertToTreeData(array, fetchedData, breed) {
    		if (array.length == 0) return;

    		array.forEach(val => {
    			if (val["children"] && val["children"].length > 0) {
    				insertToTreeData(val.children, fetchedData, breed);
    			}

    			if (val.NAME === breed) {
    				if (val["children"] && val["children"].length > 0) {
    					let temp = [...val["children"], ...fetchedData];
    					val["leaf"] = fetchedData.length == 0 ? "true" : "false";

    					// leafNode[breed] = val["leaf"];
    					val["children"] = removeDuplicates(temp);
    				} else {
    					val["leaf"] = fetchedData.length == 0 ? "true" : "false";

    					// leafNode[breed] = val["leaf"];
    					val["children"] = fetchedData;
    				}

    				return;
    			}
    		});
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<TreeApp> was created with unknown prop '${key}'`);
    	});

    	const func = val => getSubTree(val);

    	function treeview_treeNodeClicked_binding(value) {
    		treeNodeClicked = value;
    		$$invalidate(0, treeNodeClicked);
    	}

    	$$self.$capture_state = () => ({
    		TreeView: TreeViewDynamicLoad,
    		onMount,
    		treeData,
    		noDuplicatesArray,
    		tree,
    		fetchedData,
    		treeNodeClicked,
    		leafNode,
    		updateTree,
    		covertToTreeDataFormat,
    		getSubTree,
    		removeDuplicates,
    		insertToTreeData
    	});

    	$$self.$inject_state = $$props => {
    		if ('treeData' in $$props) $$invalidate(3, treeData = $$props.treeData);
    		if ('noDuplicatesArray' in $$props) noDuplicatesArray = $$props.noDuplicatesArray;
    		if ('tree' in $$props) $$invalidate(1, tree = $$props.tree);
    		if ('fetchedData' in $$props) fetchedData = $$props.fetchedData;
    		if ('treeNodeClicked' in $$props) $$invalidate(0, treeNodeClicked = $$props.treeNodeClicked);
    		if ('leafNode' in $$props) leafNode = $$props.leafNode;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*treeData*/ 8) {
    			updateTree(tree, treeData);
    		}

    		if ($$self.$$.dirty & /*treeNodeClicked*/ 1) {
    			console.log(treeNodeClicked, "treeNodeClicked");
    		}

    		if ($$self.$$.dirty & /*treeNodeClicked*/ 1) {
    			{
    				if (treeNodeClicked && treeNodeClicked["NAME"]) console.log(treeNodeClicked.leaf, "leafNode");
    			}
    		}
    	};

    	return [
    		treeNodeClicked,
    		tree,
    		getSubTree,
    		treeData,
    		func,
    		treeview_treeNodeClicked_binding
    	];
    }

    class TreeApp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeApp",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.49.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let treeapp;
    	let current;
    	treeapp = new TreeApp({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(treeapp.$$.fragment);
    			add_location(main, file, 5, 0, 62);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(treeapp, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeapp.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeapp.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(treeapp);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ TreeApp });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
