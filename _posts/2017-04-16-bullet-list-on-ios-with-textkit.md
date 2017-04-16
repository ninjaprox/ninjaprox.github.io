---
layout: post
title: Bullet list on iOS with TextKit
---

In my recent project, there is the need to display and edit bullet list on iOS, a.k.a it is a part of rich text editor. I did some rounds of searching over Google and Stack Overflow; unfortunately, there is no result satisfying me. The most common solution is adding a bullet character right in front of each item in list, which is good enough in most of cases, not mine. So what is exactly my requirement? Straightforwardly, just few things:

* Firstly, of course, display a bullet list.
* When I change text alignment, bullets still align nicely on the left side, regardless the alignment which can be left, center or right.
* Last but not least, the ability to edit the list, i.e. edit, add or remove list items without hassle of handling characters.

With that in mind, I will go through from the solution I mentioned earlier to the final one in this post.

## First come-up solution
Fairly said, this solution is simple, yet efficient in simple use cases. The idea is prepending a bullet character (•) to every new item which leads to the following.

![1st solution left alignment](/figures/20170416-1.png)

To display the above list, the string underneath would be.

```
• Bullet list\n• on iOS\n• with TextKit
```

This looks great on left alignment and easy to make, so no complaint at the moment. Let's go ahead and change to center alignment.

![1st solution center alignment](/figures/20170416-2.png)

And right alignment.

![1st solution right alignment](/figures/20170416-3.png)

Wait, bullets should align others, shouldn't them? Nice catch, and they should keep intact on the left side as well. Because we include the bullet in the item and treat it as the item's content, no wonder this behavior. One more problem does not show itself visually, when we edit an item, we can actually remove the bullet character and the space between it and the text. Moreover, when we add an item, the bullet does not come for free, we need to prepend it again to the new item's content. That being said, it is solvable by manually handling editing action, both for adding a new item and removing an item which does not appeal to me, it must be a better way.

So far, we have nice way to display a list on left alignment, with limitation on other alignments and labored editing approach.

## First attempt, draw bullets
Usually, we should address problems one by one, divide and conquer. However, in this situation, we can kill two birds with one stone as they boil down to one actual problem. Should we consider bullet character as item's content? That is the root question for this essential problem. Undoubtedly, the answer would be one big no. Since we analyzed it earlier, if bullet character is a part of item's content, effort is needed to handle it properly and this process is error prone, better to let the system do its job unless we have a really special need. Saying so, we already eliminate one problem which is to manually handling editing, and direct all focus to the another problem.

Too many words, too many explanation, where are codes, how to use `TextKit`? Wait for it, here we go. For the sake of brevity, I will not give the introduction of `TextKit` as well as its components, but explain it on usage and only parts used to solve the problem. However, it is worth to quote the following statement from [Apple's documentation](https://developer.apple.com/library/content/documentation/StringsTextFonts/Conceptual/TextAndWebiPhoneOS/CustomTextProcessing/CustomTextProcessing.html) to have a conception of `TextKit`.

> In Text Kit, an `NSTextStorage` object stores the text that is displayed by a `UITextView` object and laid out by an `NSLayoutManager` object into an area defined by `NSTextContainer` object.
And here is the relationship between them.

![TextKit components relationship](/figures/20170416-4.png)

What we are trying to do is to drawing a bullet in each item, we have three candidates to look to `UITextView`, `NSLayoutManager` and `NSTextContainer` . Among three, `NSLayoutManager` is the most promising one, while we pass over `NSTextStorage` because its name implies its job related to text storage and we do not touch the text anyway. There is a bunch of methods in `NSLayoutManager`, we do not know which one to use to achieve our goal. Most of them have _glyph_ or _line fragment_ in their name. _In typography, a glyph is an elemental symbol within an agreed set of symbols, intended to represent a readable character for the purposes of writing_ ([Wikipedia](https://en.m.wikipedia.org/wiki/Glyph)). Line fragment is the extent in which a line is drawn. To draw our bullets, we need to know where to draw it and line fragment could be a hint. We will draw it on the left side of each line fragment. Fortunately, `NSLayoutManager` allows us to do both of these, do custom draw and obtain line fragments via.

```swift
drawGlyphs(forGlyphRange:at:)
```

> Draws the glyphs in the given glyph range, which must lie completely within a single text container.

```swift
enumerateLineFragments(forGlyphRange:using:)
```

> Enumerates line fragments intersecting with the given glyph range.

We will subclass `NSLayoutManager` to override these two methods and bring bullets to live.

```swift
class BulletListLayoutManager: NSLayoutManager {
    let bulletSize = CGSize(width: 10, height: 10)
    let bulletColor = UIColor(red:0.14, green:0.48, blue:0.63, alpha:1.0)

    override func drawGlyphs(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
        super.drawGlyphs(forGlyphRange: glyphsToShow, at: origin)

        enumerateLineFragments(forGlyphRange: glyphsToShow) { (rect, usedRect, textContainer, glyphRange, _) in
            let origin = CGPoint(x: 0, y: usedRect.origin.y + (usedRect.size.height - self.bulletSize.height) / 2)

            self.bulletColor.set()
            UIBezierPath(ovalIn: CGRect(origin: origin,
                                        size: self.bulletSize)).fill()
        }
    }
}
```

Pretty simple, right? One note here is the calculation of `y` of bullet since we want bullet vertically aligns to item’s content. An another thing worth to mention is `super.drawGlyphs(forGlyphRange: glyphsToShow, at: origin)`, make sure that we do not forget to call it or nothing is drawn at all.

Now we create `NSTextView` with `BulletListLayoutManager` instead of default `NSLayoutManager`.

```swift
let textStorage = NSTextStorage()
let layoutManager = BulletListLayoutManager()
textStorage.addLayoutManager(layoutManager)
let textContainer = NSTextContainer(size: .zero)
layoutManager.addTextContainer(textContainer)
let textView = UITextView(frame: CGRect(x: 0, y: 0, width: 400, height: 200),
                          textContainer: textContainer)
```

The relationship between components guides us to create and assemble them together to create a `NSTextView` with underlying `BulletListLayoutManager` which again is used to draw bullets. Up to this point, we have our first result.

![Draw bullets result](/figures/20170416-5.png)

## Indentation
We have just drawn bullets and had them beautifully in place without any additional character added to item's content, but we are not done yet. Look at the result above, you probably notice that bullets are overlapping item's content, not what we want. On the bright side, just a small adjustment can fix this. Have you known that we have control of indent of the first line and another lines in a same paragraph by just using `attributedText` of `UITextView`? With this great support from `TextKit`, it is easy to shift right item's content and leave a consistent space between it and the bullet.

```swift
let style = NSMutableParagraphStyle()
let string = "Bullet list\non iOS\nwith TextKit. Bullet list on iOS with TextKit."
let attributedString = NSMutableAttributedString(string: string)
let range = NSRange(location: 0, length: attributedString.length)
style.firstLineHeadIndent = 20
style.headIndent = 20
attributedString.addAttribute(NSParagraphStyleAttributeName,
                              value: style,
                              range: range)
textView.attributedText = attributedString
```

Here we set the same indent for the first line and onward lines, and apply this style to the whole list to assure we have all lines left aligned.

![Indentation result](/figures/20170416-6.png)

Let's test with center and right alignment.

![Indentation center alignment result](/figures/20170416-7.png)

![Indentation right alignment result](/figures/20170416-8.png)

## Wrapped item
We are almost there, just one final step. Again, look at the result we have previously, could you find out any weird thing? _Hint: We have only three items in the list._ "You just said there were only there items?", you asked, "So where is the forth bullet come from?". Bingo, you got it. The thing is the last item is wrapped to two lines and due to the way we draw bullets, how many lines we have, as so how many corresponding bullets. Ideally, each item should only have one bullet, regardless how many lines it contains. On the other hand, we just draw bullet for the first line, a.k.a line fragment of each item. Sounds simple but how do we determine whether or not a line is the first one or second and so in an item? _Hint: Using new character._ Let me recall the underlying string of the list.

```
Bullet list\non iOS\nwith TextKit. Bullet list on iOS with TextKit.
```

From the second item, its first line is the one with the new line character `\n` immediately before its content. Now we can update the previous code to adapt to this scenario.

```swift
class BulletListLayoutManager: NSLayoutManager {
    let bulletSize = CGSize(width: 8, height: 8)
    let bulletColor = UIColor(red:0.14, green:0.48, blue:0.63, alpha:1.0)

    override func drawGlyphs(forGlyphRange glyphsToShow: NSRange, at origin: CGPoint) {
        super.drawGlyphs(forGlyphRange: glyphsToShow, at: origin)
        guard let textStorage = self.textStorage else { return }
        enumerateLineFragments(forGlyphRange: glyphsToShow) { (rect, usedRect, textContainer, glyphRange, _) in
            let origin = CGPoint(x: 0, y: usedRect.origin.y + (usedRect.size.height - self.bulletSize.height) / 2)
            var newLineRange = NSRange(location: 0, length: 0)
            if glyphRange.location > 0 {
                newLineRange.location = glyphRange.location - 1
                newLineRange.length = 1
            }
            var isNewLine = true
            if newLineRange.length > 0 {
                isNewLine = textStorage.string.substring(with: newLineRange) == "\n"
            }
            if isNewLine {
                self.bulletColor.set()
                UIBezierPath(ovalIn: CGRect(origin: origin,
                                            size: self.bulletSize)).fill()
            }
        }
    }
}
```

We treat the first line fragment is a new line by default. With the rest lines, we get the character right in front of the content of that line, then check if it is `\n`. Here we are, our final result.

![Final result](/figures/20170416-9.png)

## Conclusion
I have walked you through the whole process, from thinking, making decision to implementation that is exactly what in my mind while I was doing it. This is, however, just the beginning, there are still lots of room for you explore `TextKit`, tweak it and make it your solution for your problem. I can name some of remaining things to improve and leave them as for your exercises.

* Change bullets size corresponding to font size.
* When we change line height, content does not align bullet anymore, then we need a fix for this.
* Instead of black dot bullet, can we make other types of bullet?

## Behind the scene

I obscured some codes to keep the post focused on what matters. However, it is two-bladed knife, while it is short, it may make you perplexed, so better to uncover everything. There are two things I did not mention throughout the post. The first one is the text view and the style have been preconfigured as below to simplify the implementation of `BulletListLayoutManager`.

```swift
textView.textContainerInset = .zero
textView.textContainer.lineFragmentPadding = 0
textView.layoutManager.usesFontLeading = false
style.minimumLineHeight = fontSize
style.maximumLineHeight = fontSize
```

And if you notice, `string.substring()` only accepts `Range<String.Index>` as parameter, not `NSRange`. I created extension of `String` with `NSRange` support so that the method works seamlessly with `NSRange`.

```swift
extension String {

    func substring(with range: NSRange) -> String {
        let startIndex = index(self.startIndex, offsetBy: range.location)
        let endIndex = index(startIndex, offsetBy: range.length)
        return substring(with: startIndex ..< endIndex)
    }
}
```

## References
I recommend you to go through the following references, they are great resources, talks and libraries that helps me a lot to realize the idea.

* [Mastering TextKit](https://realm.io/news/tryswift-katsumi-kishikawa-mastering-textkit-swift-ios/)
* [Easy, Beautiful Typography with BonMot](https://realm.io/news/altconf-zev-eisenberg-easy-beautiful-typography-bonmot-library-ios-swift/)
* [Getting to Know TextKit](https://www.objc.io/issues/5-ios7/getting-to-know-textkit/)
* [String Rendering](https://www.objc.io/issues/9-strings/string-rendering/)
* [YYText](https://github.com/ibireme/YYText)
* [BonMot](https://github.com/Raizlabs/BonMot)