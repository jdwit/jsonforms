import '../../../test/helpers/setup';
import * as React from 'react';
import test from 'ava';
import { getData, initJsonFormsStore, JsonForms, update } from '@jsonforms/core';
import EnumField, { enumFieldTester } from '../../src/fields/enum.field';
import { change, findRenderedDOMElementWithTag, renderIntoDocument } from '../../../test/helpers/binding';
import { Provider } from 'react-redux';

test.before(() => {
  JsonForms.stylingRegistry.registerMany([
    {
      name: 'control',
      classNames: ['control']
    },
    {
      name: 'control.validation',
      classNames: ['validation']
    }
  ]);
});
test.beforeEach(t => {
  t.context.data = { 'foo': 'a' };
  t.context.schema = {
    'type': 'object',
    'properties': {
      'foo': {
        'type': 'string',
        'enum': ['a', 'b'],
      },
    },
  };
  t.context.uischema = {
    type: 'Control',
    scope: {
      $ref: '#/properties/foo',
    },
  };
});

test('tester', t => {
  t.is(enumFieldTester(undefined, undefined), -1);
  t.is(enumFieldTester(null, undefined), -1);
  t.is(enumFieldTester({type: 'Foo'}, undefined), -1);
  t.is(enumFieldTester({type: 'Control'}, undefined), -1);
});

test('tester with wrong prop type', t => {
  t.is(
    enumFieldTester(
      t.context.uischema,
      { type: 'object', properties: {foo: {type: 'string'}} }
    ),
    -1
  );
});

test('tester with wrong prop type, but sibling has correct one', t => {
  t.is(
      enumFieldTester(
          t.context.uischema,
          {
            'type': 'object',
            'properties': {
              'foo': {
                'type': 'string'
              },
              'bar': {
                'type': 'string',
                'enum': ['a', 'b']
              }
            }
          }
      ),
      -1
  );
});

test('tester with matching string type', t => {
  t.is(
      enumFieldTester(
          t.context.uischema,
          {
            'type': 'object',
            'properties': {
              'foo': {
                'type': 'string',
                'enum': ['a', 'b']
              }
            }
          }
      ),
      2
  );
});

test('tester with matching numeric type', t => {
  // TODO should this be true?
  t.is(
      enumFieldTester(
          t.context.uischema,
          {
            'type': 'object',
            'properties': {
              'foo': {
                'type': 'number',
                'enum': [1, 2]
              }
            }
          }
      ),
      2
  );
});

test('render', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );

  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  t.is(select.tagName, 'SELECT');
  t.is(select.value, 'a');
  t.is(select.options.length, 3);
  t.is(select.options.item(0).value, '');
  t.is(select.options.item(1).value, 'a');
  t.is(select.options.item(2).value, 'b');
});

test('update via input event', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );

  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  select.value = 'b';
  change(select);
  t.is(getData(store.getState()).foo, 'b');
});

test('update via action', t => {
  const data = { 'foo': 'b' };
  const store = initJsonFormsStore(data,  t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  store.dispatch(update('foo', () => 'b'));
  t.is(select.value, 'b');
  t.is(select.selectedIndex, 2);
});

test('update with undefined value', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  store.dispatch(update('foo', () => undefined));
  t.is(select.selectedIndex, 0);
  t.is(select.value, '');
});

test('update with null value', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  store.dispatch(update('foo', () => null));
  t.is(select.selectedIndex, 0);
  t.is(select.value, '');
});

test('update with wrong ref', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  store.dispatch(update('bar', () => 'Bar'));
  t.is(select.selectedIndex, 1);
  t.is(select.value, 'a');
});

test('update with null ref', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  store.dispatch(update(null, () => false));
  t.is(select.selectedIndex, 1);
  t.is(select.value, 'a');
});

test('update with undefined ref', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  store.dispatch(update(undefined, () => false));
  t.is(select.selectedIndex, 1);
  t.is(select.value, 'a');
});

test('disable', t => {
  const store = initJsonFormsStore(
    t.context.data,
    t.context.schema,
    t.context.uischema
  );
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema} enabled={false}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  t.true(select.disabled);
});

test('enabled by default', t => {
  const store = initJsonFormsStore(t.context.data, t.context.schema, t.context.uischema);
  const tree = renderIntoDocument(
    <Provider store={store}>
      <EnumField schema={t.context.schema} uischema={t.context.uischema}/>
    </Provider>
  );
  const select = findRenderedDOMElementWithTag(tree, 'select') as HTMLSelectElement;
  t.false(select.disabled);
});