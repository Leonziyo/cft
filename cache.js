let cache = {};

module.exports = {
    get(key) {
        return cache[key];
    },

    set(key, value) {
        cache[key] = value;
    },

    remove(key) {
        delete cache[key];
    },

    clear() {
        cache = {};
    },
};
