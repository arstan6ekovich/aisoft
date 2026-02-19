"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import backgroundImg from "@/src/assets/images/background.png";
import pumpkin from "@/src/assets/images/1.png";
import fish from "@/src/assets/images/3.png";
import kettle from "@/src/assets/images/2.png";
import scaleBase from "@/src/assets/scale/1.png";
import scalePlate from "@/src/assets/scale/2.png";
import scalePointer from "@/src/assets/scale/4.png";
import "alert-go/dist/notifier.css";
import { toast } from "alert-go";

type Item = {
  id: number;
  name: string;
  weight: number;
  ImgUrl: any;
  x: number;
  y: number;
  topOffset?: number;
};

const initialItems: Item[] = [
  { id: 1, name: "рыба", weight: 9, ImgUrl: fish, x: 0, y: 0, topOffset: 15 },
  { id: 2, name: "тыква", weight: 8, ImgUrl: pumpkin, x: 0, y: 0 },
  { id: 3, name: "чайник", weight: 7, ImgUrl: kettle, x: 0, y: 0 },
];

const ITEM_SIZE = 220;
const SCALE_WIDTH = 180;
const SCALE_HEIGHT = 220;

const Test = () => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [originalPositions, setOriginalPositions] =
    useState<Item[]>(initialItems);
  const [scaleWeight, setScaleWeight] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [weighedItems, setWeighedItems] = useState<Set<number>>(new Set());
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  const scaleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draggedIdRef = useRef<number | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (containerRef.current) {
      const startX = 60;
      const spacing = 260;
      const positioned = initialItems.map((item, index) => ({
        ...item,
        x: startX + index * spacing,
        y: 200,
      }));
      setItems(positioned);
      setOriginalPositions(positioned);
    }
  }, []);

  useEffect(() => {
    if (scaleWeight !== null && !isAnimating) {
      const timer = setTimeout(() => {
        setItems(originalPositions);
        setActiveItemId(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [scaleWeight, isAnimating, originalPositions]);

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    if (!containerRef.current) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    draggedIdRef.current = id;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (draggedIdRef.current === null || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const xInContainer = e.clientX - containerRect.left;
    const yInContainer = e.clientY - containerRect.top;

    const newX = xInContainer - offsetRef.current.x;
    const newY = yInContainer - offsetRef.current.y;

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggedIdRef.current
          ? {
              ...item,
              x: Math.max(0, Math.min(newX, containerRect.width - ITEM_SIZE)),
              y: Math.max(0, Math.min(newY, containerRect.height - ITEM_SIZE)),
            }
          : item,
      ),
    );
  };

  const handleMouseUp = () => {
    if (
      draggedIdRef.current === null ||
      !scaleRef.current ||
      !containerRef.current
    ) {
      draggedIdRef.current = null;
      return;
    }

    const item = items.find((i) => i.id === draggedIdRef.current);
    if (!item) {
      draggedIdRef.current = null;
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const itemGlobalX = containerRect.left + item.x + ITEM_SIZE / 2;
    const itemGlobalY = containerRect.top + item.y + ITEM_SIZE / 2;
    const scaleRect = scaleRef.current.getBoundingClientRect();

    const isOverScale =
      itemGlobalX >= scaleRect.left &&
      itemGlobalX <= scaleRect.right &&
      itemGlobalY >= scaleRect.top &&
      itemGlobalY <= scaleRect.bottom;

    if (isOverScale) {
      setScaleWeight(item.weight);
      setActiveItemId(item.id);
      setIsAnimating(true);

      const newX =
        scaleRect.left - containerRect.left + SCALE_WIDTH / 2 - ITEM_SIZE / 2;

      const baseY = scaleRect.top - containerRect.top - 75;

      const newY = item.id === 1 ? baseY + (item.topOffset ?? 0) : baseY;

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, x: newX, y: newY } : i)),
      );

      setTimeout(() => setIsAnimating(false), 1200);
    }

    draggedIdRef.current = null;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [items]);

  const handleSubmit = () => {
    const value = inputRef.current?.value.trim();
    if (!value) return;

    const userWeight = parseFloat(value);
    const correct = scaleWeight !== null && userWeight === scaleWeight;

    if (correct) {
      toast.success("Правильно!", {
        position: "top-right",
        duration: 1500,
      });

      const currentItem = items.find((item) => item.weight === scaleWeight);

      if (currentItem) {
        setWeighedItems((prev) => new Set(prev).add(currentItem.id));
      }
    } else {
      toast.error(`Неверно. Правильный вес: ${scaleWeight} кг`, {
        position: "top-right",
        duration: 1500,
      });
    }

    setScaleWeight(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  const currentItem =
    activeItemId !== null
      ? items.find((item) => item.id === activeItemId)
      : null;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center">
      <Image
        src={backgroundImg}
        alt="Market stall"
        width={1200}
        height={800}
        className="object-contain z-0"
        priority
      />

      <div className="absolute w-full h-full flex justify-center items-start pt-[200px]">
        <div ref={containerRef} className="relative w-[1200px] h-[400px]">
          {items.map((item) => {
            const isOnScale = item.id === activeItemId;

            return (
              <div
                key={item.id}
                className={`absolute cursor-grab z-20 transition-transform duration-500 ${
                  isOnScale && isAnimating ? "translate-y-3" : ""
                }`}
                style={{
                  left: `${item.x}px`,
                  top: `${item.y}px`,
                  width: `${ITEM_SIZE}px`,
                  height: `${ITEM_SIZE}px`,
                }}
                onMouseDown={(e) => handleMouseDown(e, item.id)}
              >
                <Image
                  src={item.ImgUrl}
                  alt={`Item ${item.id}`}
                  width={ITEM_SIZE}
                  height={ITEM_SIZE}
                  className="w-full h-full object-contain select-none"
                  draggable={false}
                />

                {weighedItems.has(item.id) && (
                  <div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-md text-sm font-bold shadow-md">
                    {item.weight} кг
                  </div>
                )}
              </div>
            );
          })}

          <div
            ref={scaleRef}
            className="absolute bottom-10 right-20 z-10"
            style={{ width: SCALE_WIDTH, height: SCALE_HEIGHT }}
          >
            <Image
              src={scaleBase}
              alt="scale base"
              className="absolute w-[110px] object-contain bottom-0 left-1/2 -translate-x-1/2"
            />

            <div
              className={`absolute bottom-[115px] left-1/2 -translate-x-1/2 transition-transform duration-500 ${
                isAnimating ? "translate-y-3" : ""
              }`}
            >
              <Image
                src={scalePlate}
                alt="scale plate"
                width={100}
                height={50}
              />
            </div>

            <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2 ">
              <Image
                src={scalePointer}
                alt="pointer"
                width={3}
                height={60}
                className="transition-transform duration-500"
                style={{
                  transform: `rotate(${scaleWeight ? scaleWeight * 18 : 0}deg)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 flex gap-2 px-4 items-center">
        <h1>
          {currentItem
            ? `Сколько весит ${currentItem.name}:`
            : "Положите предмет на весы"}
        </h1>

        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          className="px-3 py-2 text-lg rounded-lg border-2 w-[80px]"
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        />
      </div>
    </div>
  );
};

export default Test;
