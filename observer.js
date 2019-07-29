class Observer {
    constructor(data) {
        this.observer(data);
    }
    observer(data) {//要对这个data数据将原有的属性改成set get的形式
        if(!data || typeof data !== 'object') return;
        //将数据一一劫持
        //想获取data的key和value
        Object.keys(data).forEach(key => {
            //劫持
            this.defineReactive(data, key, data[key]);
            this.observer(data[key])//深层劫持
        })
    }
    defineReactive(obj, key, value) {//定义响应式（劫持）
        let that = this;
        let dep = new Dep();//每个变化的数据 都会对应一个数组，这个数组是存放所有更新的操作
        Object.defineProperty(obj, key, {
            enumerable: true,//是否可枚举
            configurable: true,//是否可以删除
            get() {//当取值时调用的方法
                Dep.target && dep.addSub(Dep.target);
                return value;
            },
            set(newValue) {
                if(newValue !== value) {//当给data属性中设置值的时候  可以对设置的值进行更改
                    that.observer(newValue);//如果设置的值是对象再一次进行劫持
                    value = newValue;
                    dep.notify();//通知所有人  数据变化了
                }
            }
        })
    }
}

class Dep{
    constructor() {
        // 订阅的数组
        this.subs = [];
    }
    addSub(watcher) {
        this.subs.push(watcher);
    }
    notify() {
        this.subs.forEach(watcher => {
            watcher.update();
        })
    }
}