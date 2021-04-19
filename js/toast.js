const iconMap = {
    success: 'check-circle',
    warn: 'exclamation-circle',
    error: 'exclamation-circle',
    disallow: 'times-circle',
    info: 'info-circle',
}
class Toast {
    static defaults = {
        time: 3000,
    }
    constructor(options) {
        this.hideTimeout = null;
        this.el = document.createElement("div");
        this.el.className = "Toaster toast";
        this.el.textContent = (typeof(options) == "string" ? options : undefined) ?? options?.message ?? options?.msg ?? '';
        if (options && typeof(options) == 'object') {
            if (options.class && typeof(options.class) == "array") {
                options.class.forEach(cl => {
                    this.el.classList.add(cl);
                })
            }
        }
        this.time = options?.time ?? Toast.defaults.time;

        if (options?.type && iconMap[options.type]) {
            this.icon = document.createElement('i');
            this.icon.className = `toast-icon fas fa-${iconMap[options.type]}`;
            this.el.appendChild(this.icon);
        }
        if (options?.closeButton ?? options?.closeBtn ?? true) {
            console.log('test');
            this.closeBtn = document.createElement('div');
            this.closeBtn.className = `toast-close fas fa-times`;
            this.closeBtn.addEventListener('click', () => {
                this.hide();
            });
            this.el.appendChild(this.closeBtn);
        }

        if (options?.type) {
            this.el.classList.add(`toast--${options.type}`);
        }
        document.body.appendChild(this.el);
    }
    show(time) {
        clearTimeout(this.hideTimeout);
        this.el.classList.add("toast--visible");
        this.hideTimeout = setTimeout(() => {
            this.el.classList.remove("toast--visible");
        }, time ?? this.time);
    }
    hide() {
        clearTimeout(this.hideTimeout);
        this.el.classList.remove("toast--visible");
    }
}
export {Toast};