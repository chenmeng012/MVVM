class MVVM{
    constructor(options) {
        //先把可用的东西挂载在实例上
        this.$el = options.el;
        this.$data = options.data;

        //判断需要编译的模版存在
        if(this.$el) {
            //数据劫持  把对象的所有属性改成get和set
            new Observer(this.$data);
            //用数据和元素进行编译
            new Compile(this.$el, this);
        }
    }
}