//观察者的作用：给需要变换的那个元素增加一个观察者，当数据变化后执行对应的方法
class Watcher{
    constructor(vm, expr, cb) {
        this.vm = vm;
        this.expr = expr;
        this.cb = cb;
        //获取老值
        this.value= this.get();
    }
    getVal(vm, expr){//获取实例上数据中对应的值
        expr = expr.split('.');//[message, a]
        return expr.reduce((prev, next) => {//收敛  data.message  data.message.a
            return prev[next];
        },vm.$data);
    }
    get() {
        Dep.target = this;
        let value = this.getVal(this.vm, this.expr);
        Dep.target = null;
        return value;
    }
    update() {//对外暴露的更新方法
        let newValue = this.getVal(this.vm, this.expr);
        let oldValue = this.value;
        if(newValue !== oldValue) {
            this.value = newValue;
            this.cb(newValue, oldValue);//调用watch的回调
        }
    }
}