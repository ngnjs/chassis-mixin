# chassis-mixins

[![Build Status](https://semaphoreci.com/api/v1/ngn/chassis-mixin/branches/master/badge.svg)](https://semaphoreci.com/ngn/chassis-mixin)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/chassis-mixin.svg)](https://saucelabs.com/u/chassis-mixin)

The Chassis mixin library is a composable JavaScript library
for extending DOM elements. For example, the `listinput` functionality
provides a few additional methods for a standard `<input>` element. This
particular mixin exists to simplify the process of capturing a list
of manually typed input, such as a comma delimited list of names. It will
listen for the `Enter` key, parse the input contents, aggregate the list
of data it has processed, optionally deduplicate lists, etc. It also
triggers custom events when these activities occur, making data binding
and reactive processing possible.

## Why?

The truth of the matter is we'd rather be using web components. However;
web components still struggle with SOC (Separation of Concerns). This
library fills the gap, giving us control over components and styling in
separate contexts. As browser support becomes more standard, specifically with CSS and shadow DOM, this library will be embedded into custom elements.
In the interim, this library can be used as a foundation for custom elements, augmentations, or as a plain old JS library.

The main motivator for this library came when we attempted to create a
`<chassis-listinput>` custom element. Functionally, it was fantastic.
However; the following CSS code in the parent HTML page caused a nightmare:

```css
chassis-listinput {
  font-size: 20px;
}
```

All we wanted to see was:

<input type="text" style="font-size: 20px;"/>

And we got this instead:

<input type="text"/>

**The Problem?**

The CSS styles are not applied to the shadow DOM. The `/deep/` selector
has been deprecated. Even Polymer stripped the ability to apply parent CSS styles to the Shadow DOM. The only option was to use CSS variables. They're pretty awesome... but no Microsoft Browser supports them. At the time of this writing, Microsoft Edge only has it "under consideration". We thought about rolling our own selector system, but identifying non-default computed CSS styles to selectively apply to shadow DOM elements is not trivial. Too much hacking, too much computational expense... you get the picture.

We anxiously await progress this are of the web components world. Once it's
there, we'll embrace it.

# Features

Chassis mixins are available on an element by element basis, or as a complete library.

## listinput

```js
var myInputField = document.getElementById('myinput')

// Apply to a single element
chassis.apply('listinput', myInputField)

// Alternative syntax
chassis.listinput(myInputField)

// Apply to multiple elements at once:
chassis.listinput('css > selector > input')
chassis.listinput([HTMLInputElementA, HTMLInputElementB])
```
