---
layout: post
title: Concurrent programming with semaphore
---

Writing an iOS app nowadays is pretty simple, however, a performant one requires more effort in many aspects from algorithm optimization to system related actions. The rule of thumb for most of cases is to keep heavy, time-consuming jobs away from main thread yet assure that calls to `UIKit` or UI related happen in main thread. That helps the app be responsive and avoid sluggishness while using to bring a better experience to users.

Dispatching job to the corresponding thread is actually dealing with concurrent programming, a challenging topic as always. Thanks to supports of high-level programming languages, libraries, and frameworks, it becomes more friendly and less error prone to work with. Depends on the complexity of the app, different techniques are used to solve appropriate problems, and one of them is using semaphore to synchronize asynchronous jobs or orchestrate them among threads. Those will be discussed in detail in this post.

## What's semaphore?

You can see analogies of semaphore in real world in many places. If you've watched a chess contest, you probably know that each player will press a common timer before going their turn in a match. There's only one chess board and only one person can make a move at a given time. Another example is checkout counters in shopping malls. Usually, there's a limited number of counters. If any of them is free, you just go check out right away. Most of cases, however, they're all occupied and there'll be long queues of people waiting to check out. Those two examples have a similarity which is a limited shared resource, the chess board and counters respectively.

Now thinking of semaphore, semaphore is a mechanism to manage shared resources and guarantee access without congestion. The resource may be a concrete thing like a variable or more abstract one like a job pool. There're two types of semaphore, binary and counting semaphore. The former can be used to implement a lock since its value is either 0 or 1 presenting unlocked or locked state, while the later allows a resource count which indicates the availability of the resource.

In Grand Central Dispatch (GCD), semaphore is an instance of [`DispatchSemaphore`](https://developer.apple.com/documentation/dispatch/dispatchsemaphore). Its API is tiny with one initializer [`init(value:)`](https://developer.apple.com/documentation/dispatch/dispatchsemaphore/1452955-init) and two primary methods [`signal()`](https://developer.apple.com/documentation/dispatch/dispatchsemaphore/1452919-signal) and [`wait()`](https://developer.apple.com/documentation/dispatch/dispatchsemaphore/2016071-wait).

_**Note:** Calls to `signal()` must be balanced with calls to `wait()`, otherwise an `EXC_BAD_INSTRUCTION` exception will be raised._

The `value` param in `init(value:)` specifies the starting value for the semaphore, we'll talk about this later on. The principle of using semaphore is quite simple, `wait()` will return outright if the value of the semaphore after decrementing is greater than or equal 0, otherwise, it will await a signal. To signal, we use `signal()` obviously, it will increment the value, then pending `wait()` callers have the chance to continue execution. The following illustration helps you understand better.

![Semaphore](/figures/20170617-1.png)

Now we know how to use `DispatchSemaphore`, let's apply it in some use cases.

## Use case 1

In this use case, we'll synchronize two asynchronous jobs in a concurrent queue. Besides, we also examine the `value` param in the initializer with the value of 0.

_**Context:** We have one concurrent queue with two asynchronous jobs, called Downloading Image and Download Frame job, dispatched to it. We want to simultaneously download the image and the frame, then combine them in either job, Download Frame job for instance._

```swift
let queue = DispatchQueue(label: "queue", attributes: .concurrent)
let semaphore = DispatchSemaphore(value: 0)

// Download Image job.
queue.async {
    Thread.sleep(forTimeInterval: 0.5)
    print("Downloaded image.")
    let signal = semaphore.signal()
    print("Signal:", signal)
}

// Download Frame job.
queue.async {
    Thread.sleep(forTimeInterval: 0.9)
    print("Downloaded frame.")
    // Await Download Image job to complete.
    semaphore.wait()
    print("Combine image and frame.")
}

// Downloaded frame.
// Downloaded image.
// Combine image and frame.
// Signal: 1
```

We created a semaphore with 0 as the initial value which means that for any first `wait()` call, it'll hang there until there's a `signal()` call. This is useful when you want to use semaphore as a lock or a synchronization flag since you don't know or have a finite pool of resources. Back to our code above, the two `Thread.sleep(forTimeInterval:)` are just simulating the download process which may take an arbitrary time to complete. Even the Download Frame job finishes first, it needs to wait for the Download Image job to be done before going to do the next step. `semaphore.wait()` will decrement the value of the semaphore, being 0 now, and be waiting. On call of `semaphore.signal()`, in contrast, it increments the semaphore back to 0 and signals the Download Frame job to continue its execution.

An interesting thing is if we swap the `Thread.sleep(forTimeInterval:)` between two jobs to let the Download Image job finishes first, everything will still work well, except a small difference.

```
// Downloaded image.
// Signal: 0
// Downloaded frame.
// Combine image and frame.
```

Can you figure out it? It's the value of `signal`. In the earlier scenario, the value is 1, whilst 0 in the later. What's it mean? The order of calls of `signal()` and `wait()` doesn't matter as long as you keep them balanced. If there's a `wait()` call before `signal()` and there's something waiting for a signal, `signal()` will return a non-zero value to indicate that. In the reverse case, it just returns zero so that you understand there's no waiting job to execute, then the corresponding `wait()` call returns immediately.

Again illustration is the best way to explain.

![Use case 1](/figures/20170617-2.png)

## Use case 2

In some cases, we want to limit the number of concurrent jobs. For example, we need to download a bunch of images but want only 2 of them at the same time. This actually can be done by using higher level API [`OperationQueue`](https://developer.apple.com/documentation/foundation/operationqueue). Here is when we use semaphore as a resource pool.

_**Context:** We have one concurrent queue. We dispatch many Download Image jobs to that queue and maximum 2 of them should be run simultaneously._

```swift
let queue = DispatchQueue(label: "queue", attributes: .concurrent)
let semaphore = DispatchSemaphore(value: 2)

for i in 0 ..< 10 {
    queue.async {
        semaphore.wait()
        print("Downloading image", i)
        let timeInterval: TimeInterval = 0.5 + (arc4random_uniform(2) == 0 ? 1.0 : -1.0) * 1.0 / Double(arc4random_uniform(10) + 1)
        Thread.sleep(forTimeInterval: timeInterval)
        print("Downloaded image", i)
        semaphore.signal()
    }
}

// Downloading image 0
// Downloading image 1
// Downloaded image 0
// Downloading image 2
// Downloaded image 2
// Downloading image 3
// Downloaded image 1
// Downloading image 4
// Downloaded image 4
// Downloading image 5
// Downloaded image 3
// Downloading image 6
// Downloaded image 5
// Downloading image 7
// Downloaded image 6
// Downloading image 8
// Downloaded image 7
// Downloading image 9
// Downloaded image 9
// Downloaded image 8
```

In this example, I randomized the `timeInterval` to simulate the download time. Looking at the log, you'll see that at initial only the image 0 and 1 are downloaded simultaneously. When the image 0 is done, the image 2 gets started, and the number of concurrent downloads still stays at 2. It keeps doing so until all images are downloaded.

![Use case 2](/figures/20170617-3.png)

## Conclusion

Semaphore is a simple yet useful tool to solve concurrent problems. In conjunction with other APIs in GCD, and higher level APIs like `OperationQueue`, you can create solutions for more complex problems.
