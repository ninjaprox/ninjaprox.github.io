---
layout: post
title: Should I use struct in Swift?
---

"Should I use struct or class?" is a common question of Swift developer. There may be something you also hear over and over again like: struct is value-semantic, struct is faster. Is it really as it being said or is there anything hidden behind? Let's find out!

# Value-semantic

It is obvious to say that struct is a value type. That means you don't need to worry about unintended changes of value when passing around variables. For example:

```swift
struct Backpack {
    var numberOfCompartments: Int
}

let myBackpack = Backpack(numberOfCompartments: 4)
var yourBackpack = myBackpack
assert(myBackpack.numberOfCompartments == 4)
yourBackpack.numberOfCompartments = 3
assert(myBackpack.numberOfCompartments == 4)
assert(yourBackpack.numberOfCompartments == 3)
```

Why will this help? Well, passing objects around is very common and so is mutating objects. Speaking of immutability and mutability, it is another discussion and I won't cover it in this post. Changes on other instances in the result of changes on one is good sometimes as that may be what you want. However, more often, it is not your intention and it causes much more hassle than help. By assuring these accidental changes not happen, you are free of worry and save time for development.

Even with reference type data inside struct, it will behave the same.

```swift
class Compartment { 
  var object: AnyObject?
}

struct Backpack {
    var compartment: Compartment
}

let myBackpack = Backpack(compartment: Compartment())
var yourBackpack = myBackpack
yourBackpack.compartment == Compartment()
assert(myBackpack.compartment !== yourBackpack.compartment)
```

If we change from struct to class, after changing `compartment` property, `myBackpack.compartment` and `yourBackpack.compartment` both still point to the same instance.

```swift
class Backpack {
    var compartment: Compartment
    // Assume that we already have proper initializer
}

let myBackpack = Backpack(compartment: Compartment())
var yourBackpack = myBackpack
yourBackpack.compartment == Compartment()
assert(myBackpack.compartment === yourBackpack.compartment)
```

## Copy-on-write

However, one question comes up with reference type data in struct, do changes on a property of `yourBackpack.compartment` cause changes on `myBackpack.compartment`? Yes, it does, for short answer. It is easy to understand because as mentioned above, `yourBackpack.compartment` and `myBackpack.compartment` are referencing to the same instance. But wait, it violates value-semantic, doesn't it? It does surely. Luckily, there is a solution for this, or just call as a workaround.

The idea is that for any change on a property of reference type data, make a copy of it first then do the change. For reading, it is not needed to do anything. If doing so, other issue raises, that is every time you change reference type data, a new copy of it will be created, this is overhead and should be avoided. Swift standard library provides a function called `isKnownUniquelyReferenced(_:)` to check whether the given object is a class instance known to have a single strong reference. By using this, you can get rid of creating redundancy.

```swift
extension Compartment: NSCopying {
    public func copy(with zone: NSZone? = nil) -> Any {
        return Compartment() // Just for demo purpose
    }
}

struct Backpack {
    private var _compartment: Compartment
    var identity: Int
    var compartmentForReading: Compartment { return _compartment }
    var compartmentForWriting: Compartment {
        mutating get {
            if !isKnownUniquelyReferenced(&_compartment) {
                _compartment = _compartment.copy() as! Compartment
                print("copying", _compartment)
            }
            return _compartment
        }
        mutating set {
            _compartment = newValue
        }
    }
    
    init(compartment: Compartment, identity: Int) {
        self._compartment = compartment
        self.identity = identity
    }
}

let myBackpack = Backpack(compartment: Compartment(), identity: 10)
var yourBackpack = myBackpack
assert(myBackpack.compartmentForReading === yourBackpack.compartmentForReading)
(yourBackpack.compartmentForWriting).object = banana
yourBackpack.identity = 20
assert(myBackpack.compartmentForReading !== yourBackpack.compartmentForReading)
assert(myBackpack.compartmentForReading.object != yourBackpack.compartmentForReading.object)
```

The indirect storage called `_compartment` is used to actually store reference type data, other two computed properties `compartmentForReading` and `compartmentForWriting` are for reading and writing purpose respectively. `compartmentForReading` simply returns the indirect storage. On the other hand, `compartmentForWriting`'s job is more complex. On getting, it checks if `_compartment` is uniquely referenced, otherwise, it creates a new copy of the indirect storage then assign back to itself. On setting, straightforwardly, it sets a new value to the indirect storage. The consequence of this is we have separate instances and prevent unintended changes.

~~_**Note:** You may ask why `(yourBackpack.compartmentForWriting).object` instead of `yourBackpack.compartmentForWriting.object`? Using the later invokes getter twice and I still don't understand this behavior in Swift, will update if finding anything._~~ This happened because I ran it on playground. I also asked on [StackOverflow](http://stackoverflow.com/questions/40316929/getter-of-computed-property-called-twice?noredirect=1#comment67891599_40316929) and found a reasonable explanation for this.

_**Caution:** This code doesn't work as I expected. In fact, `isKnownUniquelyReferenced(&_compartment)` always returns `false`, that results in copying every time there is a change on `_compartment`'s property and it is inefficient. Same as above, will update if finding anything._

# Faster

There are two factors, also myths, that impacts the performance of struct, they are memory allocation and reference counting. Let's talk about memory allocation first.

## Memory allocation

Because struct is a value type, it is stored in stack. Storing in stack is fast as stack is simple data structure with only one end to push and pop data to and from. To keep track of these actions, only one pointer is needed and it is incremented or decremented according to the action.

On the contrary, storing in heap requires more effort. At first, it needs to look up for sufficient space in memory, then stores data in there. However, the whole process is not that simple, to deal with multiple access, it also needs to do lock mechanism to make it thread-safe. As a result, storing in heap is more expensive than in stack.

Hmm, it seems to be true, especially when struct contains all value type data. In real world, things are more complicated and you want not only value type data but also reference type. How does struct handle this? Look at this example.

```swift
class Weapon { }

struct Unicorn {
    let weapon: Weapon
    let numberOfHorns: Int
}
```

`numberOfHorns` is stored in stack and it is fast. However, as `weapon` is reference-type, only its pointer is stored in stack but its actual data is stored in heap and it is not as fast as `numberOfHorns`. Therefore, struct is not really as fast as it looks at the first glare in memory allocation manner. Okay, one myth is demystified, let's move onto the next one.

## Reference counting

Working with heap requires more effort and consciousness in comparison with stack. You need to manually deallocate everything after use if memory leak is not your friend, unless there is a garbage collector or other mechanism lifting it for you under the hood. Fortunately, you don't have to do it yourself in iOS, macOS development, the OS is smart enough to detect unused chunk of data in memory and deallocate it and the OS does that by counting references to an instance. Every time a new reference created, the reference count of corresponding instance increments, the similar thing happens on removing a reference, the count decrements. When the count is zero, the OS knows this instance is not used anymore, then deallocates it from heap and save memory for later use. No wonder, this whole process is costly.

Taking advantage of not using reference counting, pure value type struct, i.e. struct has only value type data, has better performance than class. It won't be true anymore in case of reference type struct, i.e. struct has reference type data.

Let's add few more to the above example.

```swift
class Shield { }

struct Unicorn {
    let weapon: Weapon
    let shield: Shield
    let numberOfHorns: Int
}

let tom = Unicorn(weapon: Weapon(), shield: Shield(), numberOfHorns: 1)
```

There are two reference counts in the example above, one of `weapon` instance and one of `shield` instance, each is set to 1. Now we will create a new variable `jerry`, then assign `tom` to this new one.

```swift
let jerry = tom
```

The number of references here is 4. What? Because there are 2 references to each of `weapon` and `shield` instance, the reference count of each is set to 2. Better understand by looking at the following illustration.

```
            stack

   tom +----------------+
       | weapon         +------+
       +----------------+      |       heap
       | shield         +---+  |
       +----------------+   |  |  +-------------+
       | numberOfHorns  |   |  +--+ weapon      +--+
       +----------------+   |     +-------------+  |
                            +-----+ shield      +-----+
 jerry +----------------+         +-------------+  |  |
       | weapon         +--------------------------+  |
       +----------------+                             |
       | shield         +-----------------------------+
       +----------------+
       | numberOfHorns  |
       +----------------+
```

You may notice something turning not good. Let's examine the same use case with class.

```swift
class Unicorn {
    let weapon: Weapon
    let shield: Shield
    let numberOfHorns: Int
    // Assume that we already have proper initializer
}

let tom = Unicorn(weapon: Weapon(), shield: Shield(), numberOfHorns: 1)
let jerry = tom
```

Now see the graph.

```
     stack                    heap

+-------------+          +----------------+
| tom         +----------+ weapon         |
+-------------+          +----------------+
| jerry       +----------+ shield         |
+-------------+          +----------------+
                         | numberOfHorns  |
                         +----------------+
```

There are only 2 references and clearly, class outperforms in this scenario. Myth number 2, solved!

With new things introduced in Foundation framework, using proper data type will help avoid these problems whilst taking advantage of struct.

# Conclusion

At the first glare, we all seem to be dazzled by struct. Only after having a closer look, we discover many things hidden behind, these don't discourage us from using struct but give us better understanding and help make better decision. Ultimately, there is no silver bullet at all, everything is devised with purpose and should be used with awareness.

> It's not the fault of the tool, it's he doesn't learn it more.

# Reference

- [Building Better Apps with Value Types in Swift (WWDC 2015 - Session 414)](https://developer.apple.com/videos/play/wwdc2015/414)
- [Understanding Swift Performance (WWDC 2016 - Session 416)](https://developer.apple.com/videos/play/wwdc2016/416)