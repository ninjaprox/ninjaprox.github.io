---
layout: post
title: Understanding UIView’s transform property (part 1)
---

Working with `transform` property of `UIView` might be frustrated at the first time. Confusion of using `transform` leads to difficulty in controlling `UIView` as well as persisting `UIView` information. This article helps demystify this.

# Basics

Before going clarify `transform` property and how it works, let's remind some basics. With a bunch of properties and methods in `UIView`, there are only four that we need in context of this article and the rest of it focuses only these four properties to try to explain how `transform` works.

`frame`
: The frame rectangle, which describes the view’s location and size in its **superview’s coordinate system**.
    
`bounds`
: The bounds rectangle, which describes the view’s location and size in its **own coordinate system**.

`center`
: The center of the frame, i.e., it is location of the view's center point in its **superview's coordinate system**.

`transform`
: Specifies the transform applied to the receiver, **relative to the center of its bounds**.
> **WARNING**
> If this property is not the identity transform, the value of the frame property is undefined and therefore should be ignored.

These four properties have binding of each other, changes on one cause changes mostly on others. Simplest, for example, changes on `center` modify `frame`, and vise versa. We talk more about these relationships right below.

# Relationships

## `frame` changes

When `frame` changes, obviously, it causes change of `bounds` and `center` but remains `transform`.  Changes on `frame.origin` and `frame.size` result in changes on `center` and `bounds.size` respectively.

> `frame.origin` *changes* `center`
> `frame.size` *changes* `bounds.size`

## `bounds` changes

As `bounds.size` changes, the whole `frame` changes, I mean both `frame.origin` and `frame.size`. The reason is this change is relative to the view's center point, the center point keeps the same while 4 corners move inward or outward depending on decreasing or increasing the size. System now reflects these changes to the view's superview's coordinate by change the view's `frame`.

![`bounds.size` changes](/figures/20160823-1.png)

> `bounds.size` *changes* `frame.origin` and `frame.size`

`frame.size` is always equal to `bounds.size` on the other hand.

How about `bounds.origin`? It does not affect `frame` at all. It just shifts the view's content, like the way you see in `UIScrollView`.

## `center` changes

Because `center` and `frame` are both determined in superview 's coordinate system, i.e., they are in the same coordinate system, no wonder that they affect each other.

> `center` *changes* `frame.origin`

## `transform` changes

Now here is the most confusing of 4 properties. Don't panic. It is purely mathematics. What, mathematics? It is even more scary. No, even if you are not math genius, understanding it must not be hard.

The idea is that `transform` is, simplified-explanation, a calculation being applied to a view to convert every single point inside the view to new position in the same coordinate system of the view's superview. Keeping superview's coordinate system untouched helps diminish effort to work with other views that do not use `transform`, i.e., `transform` is identity.

`transform`
: input [some calculations happen here]=> output

As superview needs a straight rectangle to determine position and size of its child view, in case child view does not have one, e.g. it is rotated,  superview uses a boundary to do this job. The boundary is the smallest straight rectangle that encloses completely the view.

![View's boundary](/figures/20160823-2.png)

### Scale

Now let's scale up and down a view. Recall the earlier explanation of `transform`, when scaling a view, in fact `transform` does not change real view's size but only do conversion the size to new size in view's superview and display it. This conversion, easy to guess, has effect on view's `frame`.

![Scale](/figures/20160823-3.png)

> `transform` *changes* `frame`

What if we change `frame` after applied scale? Good question. Remember `frame.size` is always equal to `bounds.size` said earlier? New `frame.size` comes from old `frame.size`, actually comes from `bounds.size`.  On forward way, `bounds.size` is as input and new `frame.size` is as output. And `frame.size` is as input and `bounds.size` is as output in reverse.

It is supposed to be but it is not unfortunately. As warning in `transform`, `frame` should be ignored. In fact, we still can use it to new `frame` value after scaled, as well as `frame` of boundary being mentioned right below, but it is not recommended to set value, even with `frame.origin`.

Therefore the answer is shouldn't do.

### Rotation

Now it is time for rotation. As in earlier figure, when a view is rotated, it does not longer have a straight rectangle to represent in its superview. This comes to superview needs a boundary to position and measure the view. The view's `frame` now is actually the boundary's `frame` and it does not literally reflect view's position and size anymore.

> `transform` *changes* `frame`

### Combination

In combination of scale and rotation, the same principle is applied.

&nbsp;

In this part, we have better idea of 4 properties and their relationship. In the next one, we will talk more about `transform`, how to use it and applications, especially on persistence.