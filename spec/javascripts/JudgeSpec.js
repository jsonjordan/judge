describe('judge', function() {

  beforeEach(function() {
    this.addMatchers(customMatchers);
  });

  describe('judge.validate', function() {

    beforeEach(function() {
      loadFixtures('spec/javascripts/fixtures/form.html');
    });
    
    it('validates a single element', function() {
      var elements = document.getElementById('foo_one'),
          results = judge.validate(elements);
      expect(results.length).toEqual(1);
    });

    it('validates a collection of elements', function() {
      var elements = document.querySelectorAll('input[type=radio]'),
          results = judge.validate(elements);
      expect(results.length).toEqual(1);
    });

    describe('callbacks', function() {
      it('calls callback correct number of times', function() {
        var elements = document.getElementsByTagName('textarea');
            callback = jasmine.createSpy(),
            length = elements.length;
        judge.validate(elements, callback);
        expect(callback.callCount).toBe(length);
      });
    });

  });

  describe('judge.Watcher', function() {
  
    var watcher;
    
    beforeEach(function() {
      loadFixtures('spec/javascripts/fixtures/form.html');
      watcher = new judge.Watcher(document.getElementById('foo_one'));
    });

    it('returns new instance of judge', function() {
      expect(watcher.constructor).toEqual(judge.Watcher);
    });

    it('associates with element', function() {
      expect(watcher.element).toEqual(document.getElementById('foo_one'));
    });

    it('holds validators', function() {
      expect(_(watcher.validators).isArray()).toEqual(true);
      expect(_(watcher.validators).isEmpty()).toEqual(false);
    });

    it('holds messages inside validators', function() {
      expect(_(watcher.validators).first().hasOwnProperty('messages')).toBe(true);
      expect(_(watcher.validators).first().messages).toBeInstanceOf(Object);
    });

    it('has validation methods in prototype', function() {
      expect(watcher.validates()).not.toBeEmpty();
      expect(_(watcher.validates()).keys()).toContain('presence');
    });

    it('has custom validation methods when defined by user', function() {
      judge.customValidators.phatness = function() {};
      expect(_(watcher.validates()).keys()).toContain('phatness');
    });

    it('throws error if element has no data-validate attribute', function() {
      var input = document.createElement('input');
      input.type = 'text';
      expect(function() { new judge.Watcher(input); }).toThrow();
    });

    it('throws error if no element is passed', function() {
      expect(function() { new judge.Watcher(); }).toThrow();
    });

  });
    
  describe('judge.store', function() {

    var element;

    beforeEach(function() {
      loadFixtures('spec/javascripts/fixtures/form.html');
      judge.store.clear();
      element = document.getElementById('foo_one');
    });

    describe('save / get', function() {

      it('saves Watcher against key', function() {
        judge.store.save('mykey', element);
        expect(_(judge.store.get('mykey')).first().constructor).toEqual(judge.Watcher);
        expect(_(judge.store.get('mykey')).first().element).toBe(element);
      });

      it('does not save Watcher if element has already been stored against same key', function() {
        judge.store.save('mykey', element);
        judge.store.save('mykey', element);
        expect(judge.store.get('mykey').length).toEqual(1);
      });

      it('does save Watcher again if key is different', function() {
        judge.store.save('mykey', element);
        judge.store.save('mykey2', element);
        expect(judge.store.get('mykey').length).toEqual(1);
        expect(judge.store.get('mykey2').length).toEqual(1);
      });

    });

    describe('getDOM', function() {
      
      it('returns DOM elements from stored Watchers', function() {
        judge.store.save('mykey', element);
        judge.store.save('mykey', document.getElementById('foo_two_foobar'));
        var storedElements = judge.store.getDOM('mykey');
        expect(storedElements.length).toEqual(2);
        expect(Object.prototype.toString.call(storedElements[0])).toEqual('[object HTMLSelectElement]');
      });

      it('returns store object with watchers converted to elements if no key given', function() {
        judge.store.save('mykey', element);
        judge.store.save('mykey2', document.getElementById('foo_two_foobar'));
        judge.store.save('mykey2', document.getElementById('foo_three'));
        var storedElements = judge.store.getDOM();
        expect(storedElements.mykey.length).toEqual(1);
        expect(storedElements.mykey2.length).toEqual(2);
        expect(Object.prototype.toString.call(storedElements.mykey[0])).toEqual('[object HTMLSelectElement]');
      });

      it('returns null if key not found', function() {
        expect(judge.store.getDOM('notakey')).toEqual(null);
      });

    });

    describe('validate', function() {
      
      it('validates all elements stored against key', function() {
        judge.store.save('mykey', element);
        var results = judge.store.validate('mykey');
        expect(_(results).first()).toBeInstanceOf(Object);
        expect(_(results).first().element).toEqual(element);
      });

      it('returns null if no elements found', function() {
        var results = judge.store.validate('mykey');
        expect(results).toBe(null);
      });

      it('returns null if key is not passed', function() {
        var results = judge.store.validate();
        expect(results).toBe(null);
      });

    });

    describe('remove', function() {
      
      it('removes Watcher from store', function() {
        judge.store.save('mykey', element);
        expect(_(judge.store.remove('mykey', element)).isUndefined()).toEqual(true);
        expect(judge.store.get('mykey')).toBe(null);
      });

      it('returns null if key not found', function() {
        judge.store.save('mykey', element);
        expect(judge.store.remove('notakey', element)).toEqual(null);
      });

    });

    describe('clear', function() {
      
      it('clears entire store if no key is passed', function() {
        judge.store.save('mykey', element);
        judge.store.clear();
        expect(judge.store.get()).toEqual({});
      });

      it('clears all Watchers against key', function() {
        judge.store.save('mykey', element);
        judge.store.save('mykey2', element);
        judge.store.clear('mykey');
        expect(judge.store.get('mykey')).toBe(null);
        expect(judge.store.get('mykey2').length).toEqual(1);
      });

      it('returns null if key not found', function() {
        expect(judge.store.clear('notakey')).toBe(null);
      });

    });

  });

  describe('judge.Watcher instance methods', function() {

    beforeEach(function() {
      loadFixtures('spec/javascripts/fixtures/form.html');
    });

    describe('validate method', function() {
      
      var watcher, result;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_one'));
        result = watcher.validate();
      });

      it('returns element', function() {
        expect(result.element).toBeInstanceOf(Object);
      });

      it('returns validity', function() {
        expect(_.isBoolean(result.valid)).toBe(true);
      });

      it('returns messages', function() {
        expect(result.messages).toBeInstanceOf(Array);
      });

      describe('callback', function() {

        var callback, args;

        beforeEach(function() {
          callback = jasmine.createSpy();
          watcher.validate(callback);
          args = callback.argsForCall[0];
        });

        it('is called when given', function() {
          expect(callback).toHaveBeenCalled();
        });
        it('receives correct args', function() {
          expect(_.isBoolean(args[0])).toBe(true);
          expect(_.isArray(args[1])).toBe(true);
          expect(_.isElement(args[2])).toBe(true);
        });
        
      });

    });
    
    describe('presence', function() {
      
      var watcher;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_one'));
      });
      
      it('invalidates empty input', function() {
        expect(watcher.validate().valid).toEqual(false);
      });

      it('returns message', function() {
        expect(watcher.validate().messages).not.toBeEmpty();
      });

      it('validates non-empty input', function() {
        watcher.element.children[1].selected = true;
        expect(watcher.validate().valid).toEqual(true);
      });

    });

    describe('length', function() {

      var watcher;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_two_foobar'));
      });

      it('validates valid input', function() {
        watcher.element.value = 'abcdef';
        expect(watcher.validate().valid).toEqual(true);
      });

      it('validates allow_blank', function() {
        watcher.element.value = '';
        expect(watcher.validate().valid).toEqual(true);
      });

      it('returns message', function() {
        watcher.element.value = 'abc';
        expect(watcher.validate().messages).not.toBeEmpty();
      });

      it('invalidates when value is under minimum', function() {
        watcher.element.value = 'abc';
        expect(watcher.validate().valid).toEqual(false);
      });

      it('invalidates when value is over maximum', function() {
        watcher.element.value = 'abcdefghijkl';
        expect(watcher.validate().valid).toEqual(false);
      });
    });

    describe('exclusion', function() {

      var watcher;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_three'));
      });
      
      it('validates when value is not in array', function() {
        expect(watcher.validate().valid).toEqual(true);
      });

      it('invalidates when value is in array', function() {
        watcher.element.children[1].selected = true;
        expect(watcher.validate().valid).toEqual(false);
      }); 

      it('returns message', function() {
        expect(watcher.validate().messages).not.toBeEmpty();
      });

    });

    describe('inclusion', function() {

      var watcher;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_three_inc'));
      });
      
      it('validates when value is in array', function() {
        watcher.element.children[1].selected = true;
        expect(watcher.validate().valid).toEqual(true);
      });

      it('invalidates when value is not in array', function() {
        expect(watcher.validate().valid).toEqual(false);
      });

      it('returns message', function() {
        expect(watcher.validate().messages).not.toBeEmpty();
      });

    });

    describe('numericality', function() {

      var watcher, watcherEven, watcherGt, watcherLt;

      beforeEach(function() {
        watcher     = new judge.Watcher(document.getElementById('foo_four'));
        watcherEven = new judge.Watcher(document.getElementById('foo_four_even'));
        watcherGt   = new judge.Watcher(document.getElementById('foo_four_gt'));
        watcherLt   = new judge.Watcher(document.getElementById('foo_four_lt'));
      });

      it('invalidates when value is not a number', function() {
        watcher.element.value = 'foo bar';
        expect(watcher.validate().valid).toEqual(false);
        expect(watcher.validate().messages).not.toBeEmpty();
      });

      it('validates odd / invalidates not odd', function() {
        watcher.element.value = '2';
        expect(watcher.validate().valid).toEqual(false);
        expect(watcher.validate().messages).not.toBeEmpty();
        watcher.element.value = '1';
        expect(watcher.validate().valid).toEqual(true);
      });

      it('validates even / invalidates not even', function() {
        watcherEven.element.value = '1';
        expect(watcherEven.validate().valid).toEqual(false);
        expect(watcherEven.validate().messages).not.toBeEmpty();
        watcherEven.element.value = '2';
        expect(watcherEven.validate().valid).toEqual(true);
      });

      describe('integer', function() {

        it('validates int', function() {
          watcher.element.value = '1';
          expect(watcher.validate().valid).toEqual(true);
        });

        it('invalidates float', function() {
          watcher.element.value = '1.1';
          expect(watcher.validate().valid).toEqual(false);
          expect(watcher.validate().messages).not.toBeEmpty();
        });

      });

      describe('greater than', function() {
        
        it('invalidates not greater than', function() {
          watcherGt.element.value = '6';
          expect(watcherGt.validate().valid).toEqual(false);
          expect(watcherGt.validate().messages).not.toBeEmpty();
          watcherGt.element.value = '7';
          expect(watcherGt.validate().valid).toEqual(false);
          expect(watcherGt.validate().messages).not.toBeEmpty();
        });

        it('validates greater than', function() {
          watcherGt.element.value = '8';
          expect(watcherGt.validate().valid).toEqual(true);
        });

      });

      describe('less than', function() {
        
        it('invalidates not less than', function() {
          watcherLt.element.value = '8';
          expect(watcherLt.validate().valid).toEqual(false);
          watcherLt.element.value = '7';
          expect(watcherLt.validate().valid).toEqual(false);
        });

        it('validates less than', function() {
          watcherLt.element.value = '6';
          expect(watcherLt.validate().valid).toEqual(true);
        });
      });
    });

    describe('format', function() {

      describe('with', function() {
        
        var watcher;

        beforeEach(function() {
          watcher = new judge.Watcher(document.getElementById('foo_five_wi'));
        });

        it('invalidates value matching with', function() {
          expect(watcher.validate().valid).toEqual(false);
          expect(watcher.validate().messages).not.toBeEmpty();
        });

        it('invalidates value not matching with', function() {
          watcher.element.children[1].selected = true;
          expect(watcher.validate().valid).toEqual(true);
        });

      });

      describe('without', function() {

        var watcher;

        beforeEach(function() {
          watcher = new judge.Watcher(document.getElementById('foo_five_wo'));
        });

        it('validates value not matching with', function() {
          expect(watcher.validate().valid).toEqual(true);
        });

        it('invalidates value matching with', function() {
          watcher.element.children[1].selected = true;
          expect(watcher.validate().valid).toEqual(false);
          expect(watcher.validate().messages).not.toBeEmpty();
        });

      });

    });

    describe('acceptance', function() {

      var watcher;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_six'));
      });

      it('validates when element is checked', function() {
        watcher.element.checked = true;
        expect(watcher.validate().valid).toEqual(true);        
      });

      it('invalidates when element is not checked', function() {
        expect(watcher.validate().valid).toEqual(false);
      });

    });

    describe('confirmation', function() {
      
      var watcher, conf;

      beforeEach(function() {
        watcher = new judge.Watcher(document.getElementById('foo_seven'));
        conf = document.getElementById('foo_seven_confirmation');
      });

      it('validates when confirmed', function() {
        watcher.element.value = 'password';
        conf.value = 'password';
        expect(watcher.validate().valid).toEqual(true);
      });

      it('invalidates when not confirmed', function() {
        watcher.element.value = 'password';
        conf.value = 'wrongpassword';
        expect(watcher.validate().valid).toEqual(false);
      });

    });

  });

  describe('utils', function() {

    describe('isCollection', function() {
      
      beforeEach(function() {
        loadFixtures('spec/javascripts/fixtures/form.html');
      });

      it('returns true if judge can treat object as collection', function() {
        var a = [],
            n = document.getElementsByTagName('input');
        expect(judge.utils.isCollection(a)).toEqual(true);
        expect(judge.utils.isCollection(n)).toEqual(true);
      });

      it('returns false otherwise', function() {
        var o = { a:1, b:2 };
        expect(judge.utils.isCollection(o)).toEqual(false);
      });

    });

    describe('getObjectString', function() {
      
      it('returns type as represented in Object.prototype.toString', function() {
        var i = document.createElement('input'),
            s = document.createElement('select');
        expect(judge.utils.getObjectString(i)).toEqual('HTMLInputElement');
        expect(judge.utils.getObjectString(s)).toEqual('HTMLSelectElement');
      });

    });
    
    describe('isInt', function() {
      
      it('returns true when int', function() {
        expect(judge.utils.isInt(1)).toEqual(true);
        expect(judge.utils.isInt(1.)).toEqual(true);
        expect(judge.utils.isInt(1.0)).toEqual(true);
        expect(judge.utils.isInt(0)).toEqual(true);
        expect(judge.utils.isInt(-1)).toEqual(true);
      });

      it('returns false when not int', function() {
        expect(judge.utils.isInt(1.1)).toEqual(false);
        expect(judge.utils.isInt(-1.1)).toEqual(false);
      });

    });

    describe('isFloat', function() {
      
      it('returns true when float', function() {
        expect(judge.utils.isFloat(1.1)).toEqual(true);
        expect(judge.utils.isFloat(-1.1)).toEqual(true);
      });
      
      it('returns false when not float', function() {
         expect(judge.utils.isFloat(1)).toEqual(false);
         expect(judge.utils.isFloat(1.)).toEqual(false);
         expect(judge.utils.isFloat(1.0)).toEqual(false);
         expect(judge.utils.isFloat(0)).toEqual(false);
         expect(judge.utils.isFloat(-1)).toEqual(false);
      });

    });

    describe('isEven', function() {
      
      it('returns true when even', function() {
        expect(judge.utils.isEven(2)).toEqual(true);
        expect(judge.utils.isEven(0)).toEqual(true);
        expect(judge.utils.isEven(-2)).toEqual(true);
      });
      
      it('returns false when odd', function() {
        expect(judge.utils.isEven(1)).toEqual(false);
        expect(judge.utils.isEven(-1)).toEqual(false);
      });

    });

    describe('isOdd', function() {
      
      it('returns true when odd', function() {
        expect(judge.utils.isOdd(1)).toEqual(true);
        expect(judge.utils.isOdd(-1)).toEqual(true);
      });
      
      it('returns false when even', function() {
        expect(judge.utils.isOdd(2)).toEqual(false);
        expect(judge.utils.isOdd(0)).toEqual(false);
        expect(judge.utils.isOdd(-2)).toEqual(false);
      });

    });

    describe('operate', function() {
      
      it('evaluates and returns true or false', function() {
        expect(judge.utils.operate(1, '<', 4)).toEqual(true);
        expect(judge.utils.operate(1, '==', 1)).toEqual(true);
        expect(judge.utils.operate(1, '>=', 4)).toEqual(false);
      });

    });

    describe('convertRegExp', function() {
      
      it('converts string format options-first ruby regexp into RegExp object', function() {
        var re = judge.utils.convertRegExp('(?mix:[A-Z0-9]\.)');
        expect(re).toBeInstanceOf(RegExp);
        expect(re.source).toEqual('[A-Z0-9]\.');
        expect(re.multiline).toEqual(true);
        expect(re.global).toEqual(false);
      });

    });

    describe('convertFlags', function() {

      it('returns m if present in options string without negation', function() {
        expect(judge.utils.convertFlags('mix')).toEqual('m');
        expect(judge.utils.convertFlags('m-ix')).toEqual('m');
        expect(judge.utils.convertFlags('mx-i')).toEqual('m');
      });

      it('returns empty string otherwise', function() {
        expect(judge.utils.convertFlags('ix-m')).toEqual('');
        expect(judge.utils.convertFlags('x-mi')).toEqual('');
      });

    });

  });
   
});
