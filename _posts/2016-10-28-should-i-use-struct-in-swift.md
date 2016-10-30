---
layout: post
title: Should I use struct in Swift?
---

"Should I use struct or class?" is a common question of Swift developer. There may be something you also hear over and over again like: struct is value semantic, struct is faster. Is it really as it being said or is there any thing hidden behind? Let's find out!

# Value semantic

It is obvious to say that struct is a value type. That means you don't need to worry about unintended change of value when passing around variables. For example:

```swift
struct Vehicle {
    var numberOfWheels: Int
}

let car = Vehicle(numberOfWheels: 4)
var trishaw = car
assert(car.numberOfWheels == 4)
trishaw.numberOfWheels = 3
assert(car.numberOfWheels == 4)
assert(trishaw.numberOfWheels == 3)
```

Why will this help? Well, passing objects around is very common and mutating objects is so as well. Speaking of immutability and mutability, it is another discussion and I won't cover it in this post. Change of other instances in result of change of one is good sometimes as that may be what you want. However, more often, it is not your intention and it causes much more hassle than help. By assuring those accidental changes not happen, you are free of worry and save time for development.

Even with reference type data inside struct, it will behaves the same.

```swift
struct A {
    var view: UIView
}

let a = A(view: UIView())
var aa = a
aa.view == UIView()
assert(a.view !== aa.view)
```

If we change from struct to class, after changing `view` property, `a.view` and `aa.view` both still point to the same instance.

```swift
class A {
    var view: UIView
    // Assume that we already have proper initializer
}

let a = A(view: UIView())
var aa = a
aa.view == UIView()
assert(a.view === aa.view)
```

## Copy-on-write

However, one question comes up with reference type data in struct, does change on property of `aa.view` cause change in `a.view`? Yes, it does, for short answer. It is easy to understand because as mentioned above, `aa.view` and `a.view` are referencing to the same instance. But wait, it violates value semantic, doesn't it? It does surely. Luckily, there is solution for this, or just call as a workaround.

The idea is that for any change on property of reference type data, make a copy of it first then do the change. For reading, it is not needed to do anything. If doing so, another issue raises, that is every time you change reference type data, a new copy of it will be created, this is overhead and should be avoided. Swift standard library provides a function called `isKnownUniquelyReferenced(_:)` to check whether the given object is a class instance known to have a single strong reference. By using this, you can get rid of creating redundant copy.

```swift
extension UIView: NSCopying {
    public func copy(with zone: NSZone? = nil) -> Any {
        return UIView() // Just for demo purpose
    }
}

struct A {
    private var _view1: UIView
    var number1: Int
    var view1ForReading: UIView { return _view1 }
    var view1ForWriting: UIView {
        mutating get {
            if !isKnownUniquelyReferenced(&_view1) {
                _view1 = _view1.copy() as! UIView
                print("copying", _view1)
            }
            return _view1
        }
        mutating set {
            _view1 = newValue
        }
    }
    
    init(view1: UIView, number1: Int) {
        self._view1 = view1
        self.number1 = number1
    }
}

let a = A(view1: UIView(), number1: 10)
var aa = a
assert(a.view1ForReading === aa.view1ForReading)
(aa.view1ForWriting).backgroundColor = .red
aa.number1 = 20
assert(a.view1ForReading !== aa.view1ForReading)
assert(a.view1ForReading.backgroundColor != aa.view1ForReading.backgroundColor)
```

Indirect storage called `_view1` is used to actually store reference type data, other two computed properties `view1ForReading` and `view1ForWriting` are for reading and writing purpose respectively. The `view1ForReading` simply returns indirect storage. On the other hand, `view1ForWriting`'s job is more complex. On getting, it checks if `_view1` is uniquely referenced, otherwise it creates a new copy of indirect storage then assign back to storage itself. On setting, straightforwardly, it sets new value to indirect storage. Consequence of this is we have separate instances and prevent unintended change.

~~_**Note:** You may ask why `(aa.view1ForWriting).backgroundColor` instead of `aa.view1ForWriting.backgroundColor`? Using the later invokes getter twice and I still don't understand this behavior in Swift, will update if found anything._~~ This happened because I ran it on playground. I also asked on [StackOverflow](http://stackoverflow.com/questions/40316929/getter-of-computed-property-called-twice?noredirect=1#comment67891599_40316929) and found reasonable explanation for this.

_**Caution:** This code doesn't work as I expected. In fact, `isKnownUniquelyReferenced(&_view1)` always returns `false`, that results in copying every time there is change on `_view1`'s property and it is inefficient. Same as above, will update if found anything._

# Faster

There are two factors, also myths that impacts performance of struct, they are memory allocation and reference counting. Let's talk about memory allocation first.

## Memory allocation

Because struct is value type, it is stored in stack. Storing in stack is fast as stack is simple data structure with only one end to push and pop data to and from. To keep track of these actions, only one pointer is needed and it is incremented or decremented according the action.

On the contrary, storing in heap requires more effort. At first, it need to look up for sufficient space in memory, then store data in there. However, the whole process is not that simple, to deal with multiple access, it also needs to do lock mechanism to make it thread-safe. As a result, storing in heap is more expensive that in stack.

Hmm, it seems to be true, especially when struct contains all value type data. In real world, things are more complicated and you want not only value type data but also reference type ones. How does struct handle this? Look at this example.

```swift
class One { }

struct Two {
    let one: One
    let number: Int
}
```

`number` is stored in stack and it is fast. However, as `one` is reference type, only its pointer is stored in stack but its actual data is stored in heap and it is not as fast as `number`. Therefore, struct is not really as fast as it looks at the first glare on memory allocation manner. Okay, one myth is demystified, let's move on the next one.

## Reference counting

Working with heap requires more effort and consciousness in comparison with stack. You need to manually deallocate everything after use if memory leak is your friend, unless there is garbage collector or other mechanism lifting it for you under the hood. Fortunately, you don't have to do it yourself in iOS, macOS development, the OS is smart enough to detect unused chunk of data in memory and deallocate it and the OS does that by counting reference to instance. Every time a new reference created, reference count of corresponding instance increments, the similar thing happens on removing a reference, the count decrements. When the count is zero, the OS knows this instance is not used any more, then deallocate it from heap and save memory for later use. No wonder, this whole process is costly.

Taking advantage of not using reference counting, pure value type struct, i.e. struct has only value type data, has better performance than class. It won't be true anymore in case of reference type struct, i.e. struct has reference type data.

Let's add few more to the above example.

```swift
class Three { }

struct Two {
    let one: One
    let three: Three
    let number: Int
}

let two = Two(one: One(), three: Three(), number: 1)
```

There are two reference counts in the example above, one of `one` instance and one of `three` instance, each is set to 1. Now we will create a new variable `twotwo`, then assign `two` to this new one.

```swift
let twotwo = two
```

The number of references here is 4. What? Because there are 2 references to each of `one` and `three` instance, the reference count of each is set to 2. Better understand by looking at the following illustration.

```
            stack

   two +-------------+
       | one         +------+
       +-------------+      |       heap
       | three       +---+  |
       +-------------+   |  |  +-------------+
       | number = 1  |   |  +--+ one         +--+
       +-------------+   |     +-------------+  |
                         +-----+ three       +-----+
twotwo +-------------+         +-------------+  |  |
       | one         +--------------------------+  |
       +-------------+                             |
       | three       +-----------------------------+
       +-------------+
       | number = 1  |
       +-------------+
```

You may notice something turning not good. Let's examine the same use case with class.

```swift
class Two {
    let one: One
    let three: Three
    let number: Int
    // Assume that we already have proper initializer
}

let two = Two(one: One(), three: Three(), number: 1)
let twotwo = two
```

Now see the graph.

```
     stack                    heap

+-------------+          +-------------+
| two         +----------+ one         |
+-------------+          +-------------+
| twotwo      +----------+ three       |
+-------------+          +-------------+
                         | number = 1  |
                         +-------------+
```

There are only 2 references and clearly, class outperforms in this scenario. Myth number 2, solved!

With new things introduced in Foundation framework, using proper data type will help avoid these problems in struct whilst take advantage of struct.

# Conclusion

At the first glare, we all seem to be dazzled by struct. Only after having a closer look, we discover many things hidden behind, those don't discourage us from using struct but give us better understanding and help make better decision. Ultimately, there is no silver bullet at all, everything is devised with purpose and should be used with awareness.

> It's no fault of the tool, it's he doesn't learn it more.

# Reference

- [Building Better Apps with Value Types in Swift (WWDC 2015 - Session 414)](https://developer.apple.com/videos/play/wwdc2015/414)
- [Understanding Swift Performance (WWDC 2016 - Session 416)](https://developer.apple.com/videos/play/wwdc2016/416)