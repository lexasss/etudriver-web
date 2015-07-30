QUnit.module( 'Utils', {
    beforeEach: function() {
        this.utils = window.GazeTargets.Utils;
    },
    afterEach: function() {
    }
});

QUnit.test( 'bool', function( assert ) {
    assert.strictEqual( this.utils.bool(function () { return true; }), true, 'function returns true' );
    assert.strictEqual( this.utils.bool(function () { return false; }), false, 'function returns false' );
    assert.strictEqual( this.utils.bool(true), true, 'true' );
    assert.strictEqual( this.utils.bool(false), false, 'false' );
    assert.strictEqual( this.utils.bool({}), false, '{}' );
    assert.strictEqual( this.utils.bool({a: 1}), true, '{a: 1}' );
    assert.strictEqual( this.utils.bool([]), false, '[]' );
    assert.strictEqual( this.utils.bool([0]), true, '[0]' );
    assert.strictEqual( this.utils.bool(''), false, '""' );
    assert.strictEqual( this.utils.bool('1'), true, '"1"' );
    assert.strictEqual( this.utils.bool(null), false, 'null' );
    assert.strictEqual( this.utils.bool(window.aaaa), false, 'undefined' );
});

QUnit.test( 'extend', function( assert ) {
    var obj = this.utils.extend(true, {a: 1}, {a: 2, b: 2}, {a: 3, c: {d: 1} });
    assert.notEqual(obj, null, 'not empty' );
    assert.equal(obj.a, 3, 'a = 3' );
    assert.equal(obj.b, 2, 'b = 2' );
    assert.equal(obj.c.d, 1, 'c.d = 1' );
});

QUnit.test( 'detectPath', function( assert ) {
    var script = this.utils.detectPath(/(^|\/)utils\.js([?#].*)?$/i);
    assert.ok(script.path, 'path' );
    assert.equal(script.version, '', 'version' );
});

QUnit.test( 'clone', function( assert ) {
    assert.strictEqual(this.utils.clone(1), 1, '1');
    assert.strictEqual(this.utils.clone(null), null, 'null');
    assert.strictEqual(this.utils.clone('aa'), 'aa', '"aa"');
    assert.propEqual(this.utils.clone([1, 2, 3]), [1, 2, 3], '[1, 2, 3]');
    assert.propEqual(this.utils.clone({a: 'qwerty', b: {c: 2}}), {a: 'qwerty', b: {c: 2}}, '{a: "qwerty", b: {c: 2}}');
});

QUnit.test( 'getRandomInt', function( assert ) {
    assert.ok(this.utils.getRandomInt(100) <= 100, '0-100' );
    assert.ok(this.utils.getRandomInt(90, 100) >= 90, '90-100' );
});

QUnit.test( 'getScreenSize', function( assert ) {
    var screenSize = this.utils.getScreenSize();
    assert.ok(screenSize.width > 0 && screenSize.height > 0, 'width and height exist' );
});

QUnit.test( 'updatePixelConverter & convertors', function( assert ) {
    this.utils.updatePixelConverter();
    
    var screenPoint = {x: 100, y: 100};
    var clientPoint = {x: 100, y: 100};
    
    var clientPointConv = this.utils.screenToClient(screenPoint.x, screenPoint.y);
    var screenPointConv = this.utils.clientToScreen(clientPointConv.x, clientPointConv.y);
    assert.ok(screenPointConv.x > screenPoint.x - 0.1 && screenPointConv.x < screenPoint.x + 0.1, 'screen - client - screen, x' );
    assert.ok(screenPointConv.y > screenPoint.y - 0.1 && screenPointConv.y < screenPoint.y + 0.1, 'screen - client - screen, y' );
    
    screenPointConv = this.utils.clientToScreen(clientPoint.x, clientPoint.y);
    clientPointConv = this.utils.screenToClient(screenPointConv.x, screenPointConv.y);
    assert.ok(clientPointConv.x > clientPoint.x - 0.1 && clientPointConv.x < clientPoint.x + 0.1, 'client - screen - client, x' );
    assert.ok(clientPointConv.y > clientPoint.y - 0.1 && clientPointConv.y < clientPoint.y + 0.1, 'client - screen - client, y' );
});

QUnit.test( 'storage', function( assert ) {
    var data = {id: 'mydata', default: 100};
    this.utils.store(data, 200);
    var value = this.utils.getStoredValue(data);
    if (value == 100) {
        assert.ok(true, 'value was not stored, using the default' );
    } else if (value == 200) {
        assert.ok(true, 'value was stored' );
    } else {
        assert.ok(false, 'value was not stored, and is not the default' );
    }
});

