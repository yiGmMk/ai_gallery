import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import Layout from "../../components/layout";
import PageHeader from "../../components/header";
import SEO from "../../components/seo";

class Stack {
  constructor(maxSize = 10) {
    this.items = [];
    this.maxSize = maxSize;
  }

  push(element) {
    if (this.items.length >= this.maxSize) {
      throw new Error("Stack is full");
    }
    this.items.push(element);
    return element;
  }

  pop() {
    if (this.isEmpty()) {
      throw new Error("Stack is empty");
    }
    return this.items.pop();
  }

  isEmpty() {
    return this.items.length === 0;
  }

  isFull() {
    return this.items.length === this.maxSize;
  }

  getItems() {
    return [...this.items];
  }

  setMaxSize(newSize) {
    if (newSize < this.items.length) {
      throw new Error("New size is smaller than current stack size");
    }
    this.maxSize = newSize;
  }
}

const StackVisualization = () => {
  const [stack, setStack] = useState(new Stack(10));
  const [items, setItems] = useState([]);
  const [poppedItems, setPoppedItems] = useState([]);
  const [pushedItems, setPushedItems] = useState([]);
  const [nextNumber, setNextNumber] = useState(Math.floor(Math.random() * 100));
  const [message, setMessage] = useState("");
  const [animatingItem, setAnimatingItem] = useState(null);
  const [stackHeight, setStackHeight] = useState(10);
  const nextItemRef = useRef(null);
  const stackRef = useRef(null);
  const { t } = useTranslation();

  const updateStack = () => {
    setItems(stack.getItems());
  };

  const generateNextNumber = () => {
    setNextNumber(Math.floor(Math.random() * 100));
  };

  const push = () => {
    if (stack.isFull()) {
      setMessage({ key: "stackFull" });
      return;
    }
    const newItem = nextNumber;
    const nextItemRect = nextItemRef.current.getBoundingClientRect();
    const stackRect = stackRef.current.getBoundingClientRect();
    const startX = nextItemRect.left - stackRect.left + nextItemRect.width / 2;
    const startY = nextItemRect.top - stackRect.top;
    const endX = stackRect.width / 2;
    const endY = stackRect.height - (items.length + 1) * 50;

    setAnimatingItem({ value: newItem, startX, startY, endX, endY });

    setTimeout(() => {
      stack.push(newItem);
      updateStack();
      setAnimatingItem(null);
      setMessage({ key: "pushed", params: { item: newItem } });
      setPushedItems((prev) => [...prev, newItem]);
      generateNextNumber();
    }, 500);
  };

  const pop = () => {
    console.log(stack.isEmpty(), stack);
    if (stack.isEmpty()) {
      setMessage({ key: "stackEmpty" });
      return;
    }
    const poppedItem = stack.pop();
    updateStack();
    setMessage({ key: "popped", params: { item: poppedItem } });
    setPoppedItems((prev) => [...prev, poppedItem]);
  };

  const reset = () => {
    setItems([]);
    setStack(new Stack(stackHeight));
    setPoppedItems([]);
    setPushedItems([]);
    setMessage({ key: "stackReset" });
    generateNextNumber();
    setAnimatingItem(null);
  };

  const handleHeightChange = (e) => {
    const newHeight = parseInt(e.target.value, 10);
    if (newHeight >= items.length) {
      setStackHeight(newHeight);
      const newStack = new Stack(newHeight);
      items.forEach((item) => newStack.push(item));
      setStack(newStack);
      setMessage({ key: "stackHeightAdjusted", params: { height: newHeight } });
    } else {
      setMessage({ key: "invalidNewHeight" });
    }
  };

  useEffect(() => {
    const keyframes = animatingItem
      ? `
      @keyframes dropAnimation {
        0% {
          transform: translate(${animatingItem.startX}px, ${animatingItem.startY}px);
        }
        100% {
          transform: translate(${animatingItem.endX}px, ${animatingItem.endY}px);
        }
      }
    `
      : "";

    const styleElement = document.createElement("style");
    styleElement.innerHTML = keyframes;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, [animatingItem]);

  return (
    <Layout>
      <PageHeader />
      <div className="flex flex-col items-center p-6">
        <div className="flex justify-center w-full mb-6">
          <div className="flex flex-col items-center w-2/5">
            <div className="flex items-center justify-center mb-9">
              <div className="flex items-center mr-2 h-12 font-bold">{t("nextElement")}</div>
              <div
                ref={nextItemRef}
                className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center font-bold"
              >
                {nextNumber}
              </div>
            </div>

            <div className="flex items-start">
              <div
                className="flex flex-col justify-between mr-2"
                style={{ height: `${stackHeight * 50}px`, minHeight: "50px" }}
              >
                <div className="flex-grow">
                  {items.length > 0 && (
                    <div
                      className="bg-red-500 text-white px-2 py-1 text-sm rounded-l mb-1 transition-all duration-300"
                      style={{ marginTop: `${(stackHeight - items.length) * 50}px` }}
                    >
                      {t("stackTop")}
                    </div>
                  )}
                </div>
                <div className="bg-blue-500 text-white px-2 py-1 text-sm rounded-l">{t("stackBottom")}</div>
              </div>
              {/* 栈主体 */}
              <div
                ref={stackRef}
                className="w-60 rounded-2xl overflow-hidden relative mb-9"
                style={{
                  display: "grid",
                  gridTemplateRows: `repeat(${stackHeight}, 50px)`,
                  height: `${stackHeight * 50}px`,
                  borderLeft: "4px solid #3b82f6",
                  borderRight: "4px solid #3b82f6",
                  borderBottom: "4px solid #3b82f6",
                  borderRadius: "0 0 20px 20px",
                }}
              >
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="grid place-items-center w-full p-3 bg-white border-2 border-blue-300 text-center text-lg font-semibold transition-all duration-500"
                    style={{ gridRowStart: stackHeight - index }}
                  >
                    {item}
                  </div>
                ))}
                {animatingItem && (
                  <div
                    className="absolute w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center text-lg font-semibold"
                    style={{
                      animation: "dropAnimation 0.5s forwards",
                    }}
                  >
                    {animatingItem.value}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={push}
                className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300"
                disabled={animatingItem}
              >
                {t("push")}
              </button>
              <button
                onClick={pop}
                className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300"
                disabled={animatingItem}
              >
                {t("pop")}
              </button>
              <button
                onClick={reset}
                className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300"
              >
                {t("reset")}
              </button>
              <label htmlFor="stackHeight" className="flex items-center">
                {t("stackHeight")}:
              </label>
              <input
                id="stackHeight"
                type="number"
                min={items.length}
                value={stackHeight}
                onChange={handleHeightChange}
                className="w-16 px-2 py-1 border border-gray-300 rounded"
              />
            </div>
            <p className="mt-6 text-lg font-medium text-gray-700">
              {message.key ? t(message.key, message.params) : t(message)}
            </p>
          </div>
          <div className="flex flex-col items-center w-2/5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold mb-4"></div>
            {pushedItems.length > 0 && (
              <div className="w-full rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{t("pushedElements")}: </h3>
                <div className="flex flex-wrap gap-2">
                  {pushedItems.map((item, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center font-bold"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {poppedItems.length > 0 && (
              <div className="w-full mt-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{t("poppedElements")}: </h3>
                <div className="flex flex-wrap gap-2">
                  {poppedItems.map((item, index) => (
                    <div
                      key={index}
                      className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center font-bold"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StackVisualization;

export const Head = () => (
  <SEO
    title="Stack Visualization"
    description="Explore our interactive Stack Visualization tool designed to help you understand and visualize the basic operations of a stack data structure in real-time. Perfect for students, educators, and programming enthusiasts looking to enhance their understanding of stack operations such as push, pop, and peek."
    keywords="stack visualization, stack data structure, visualize stack operations, stack push, stack pop, stack peek, real-time stack visualization, stack tutorial, learn stack, data structure visualization"
    canonicalUrl="https://gallery.selfboot.cn/algorithms/stack/"
    publishedDate="2024-07-22T12:30:00+08:00"
    updatedDate="2024-07-22T12:30:00+08:00"
  />
);
