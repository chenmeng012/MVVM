class Compile{
    constructor(el, vm) {
        this.el = this.isElementNote(el)? el : document.querySelector(el);// 有可能是元素也有可能是字符串
        this.vm = vm;
        if(this.el) {
            //如果这个元素可以获取到 开始编译
            //1.先将这些真实dom移入内存  fragment（文档碎片）
            let fragment = this.node2fragment(this.el);
            //2.编译 =》 提取想要的元素节点 v- 和 文本节点 {{}}
            this.compile(fragment);
            //3.将编译好的dom放回页面中
            this.el.append(fragment);
        }
    }
    /* 辅助方法 */
    isElementNote(node) {//是不是元素
        return node.nodeType === 1;
    }
    isDirective(name) {//是不是指令
        return name.includes('v-');
    }
    /* 核心方法 */
    compileElement(node) {
        //带 v-mode、v-bind
        let attrs = node.attributes;//取出元素节点的属性
        Array.from(attrs).forEach(attr => {
            //判断属性名称是否包含v-
            let name = attr.name;//v-mode、、、
            if(this.isDirective(name)) {
                //取出对应的值放到节点中
                let expr = attr.value;
                //node this.vm.$data expr
                let [, type] = name.split('-');
                CompileUtil[type](node, this.vm, expr);
            }
        })
    }
    compileText(node) {
        //带{{}}
        let expr = node.textContent;//取文本中内容
        let reg = /\{\{([^}]+)\}\}/g;
        if(reg.test(expr)) {
            //node this.vm.$data expr
            CompileUtil['text'](node, this.vm, expr);
        }
    }
    node2fragment(el) {//需要将el中内容全部放到内存中
        //文档碎片 内存中的dom
        let fragment = document.createDocumentFragment();
        let firstChild;
        while(firstChild = el.firstChild) {
            fragment.appendChild(firstChild);
        }
        return fragment;
    }
    compile(fragment) {
        //需要递归
        let childNodes = fragment.childNodes;
        Array.from(childNodes).forEach(node => {
            if(this.isElementNote(node)){//是元素节点
                //如果是元素需要深入检查元素
                //需要编译元素
                this.compileElement(node);
                this.compile(node);
            } else {//文本节点
                //需要编译文本
                this.compileText(node);
            }
        });
    }
}

CompileUtil = {
    setVal(vm, expr, value) {
        expr = expr.split('.');
        return expr.reduce((prev, next, currentIndex) => {
            if(currentIndex === expr.length - 1) {
                return prev[next] = value;
            };
            return prev[next];
        },vm.$data);
    },
    getVal(vm, expr){//获取实例上数据中对应的值
        expr = expr.split('.');//[message, a]
        return expr.reduce((prev, next) => {//收敛  data.message  data.message.a
            return prev[next];
        },vm.$data)
    },
    getTextVal(vm, expr) {
        return expr.replace(/\{\{([^}]+)\}\}/g,(...arguments) => {
            return this.getVal(vm, arguments[1]);
        });
    },
    text(node, vm, expr) {//文本处理
        let updateFn = this.updater['textUpdate'];
        //expr === {{message.a}} word  => hello word
        let value = this.getTextVal(vm, expr);
        expr.replace(/\{\{([^}]+)\}\}/g,(...arguments) => {
            new Watcher(vm, arguments[1], (newValue) => {
                //如果数据变化了， 文本节点需要重新获取依赖数据更新文本中的内容
                updateFn && updateFn(node, this.getTextVal(vm, expr));
            });
        });
        updateFn && updateFn(node, value);
    },
    model(node,vm, expr) {//输入框处理
        let updateFn = this.updater['modelUpdate'];
        //expr === message || express === message.a
        //message.a => [message, a]
        //这里需要增加监控， 数据变化了， 就应该调用回调函数，重新给节点赋值
        new Watcher(vm, expr, (newValue) => {
            //当数据变化后会调用cb 将新值传递回来
            updateFn && updateFn(node, this.getVal(vm, expr));
        });
        node.addEventListener('input',(e) => {
            let newValue = e.target.value;
            this.setVal(vm, expr, newValue)
        });
        updateFn && updateFn(node, this.getVal(vm, expr));
    },
    updater: {
        textUpdate(node, value) {
            node.textContent = value;
        },
        modelUpdate(node, value) {
            node.value = value;
        }
    }
}