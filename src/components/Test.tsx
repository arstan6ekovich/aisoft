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
  const [originalPositions, setOriginalPositions] = useState<Item[]>(initialItems);
  const [scaleWeight, setScaleWeight] = useState<number | null>(null);
  const [pointerAngle, setPointerAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [weighedItems, setWeighedItems] = useState<Set<number>>(new Set());
  const [activeItemId, setActiveItemId] = useState<number | null>(null);

  const scaleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const draggedIdRef = useRef<number | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Баштапкы позиция
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

  // Фото кайра ордуна барганда жебени 0 кылуу
  useEffect(() => {
    if (scaleWeight !== null && !isAnimating) {
      const timer = setTimeout(() => {
        setItems(originalPositions);
        setActiveItemId(null);
        setPointerAngle(0);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [scaleWeight, isAnimating, originalPositions]);

  const handleMouseDown = (e: React.MouseEvent, id: number) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();

    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    draggedIdRef.current = id;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current || draggedIdRef.current === null) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    const newX = e.clientX - containerRect.left - offsetRef.current.x;
    const newY = e.clientY - containerRect.top - offsetRef.current.y;

    setItems((prev) =>
      prev.map((item) =>
        item.id === draggedIdRef.current
          ? {
              ...item,
              x: Math.max(0, Math.min(newX, containerRect.width - ITEM_SIZE)),
              y: Math.max(0, Math.min(newY, containerRect.height - ITEM_SIZE)),
            }
          : item
      )
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
    if (!item) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const scaleRect = scaleRef.current.getBoundingClientRect();

    const itemCenterX = containerRect.left + item.x + ITEM_SIZE / 2;
    const itemCenterY = containerRect.top + item.y + ITEM_SIZE / 2;

    const isOverScale =
      itemCenterX >= scaleRect.left &&
      itemCenterX <= scaleRect.right &&
      itemCenterY >= scaleRect.top &&
      itemCenterY <= scaleRect.bottom;

    if (isOverScale) {
      setScaleWeight(item.weight);
      setPointerAngle(item.weight * 18);
      setActiveItemId(item.id);
      setIsAnimating(true);

      const newX =
        scaleRect.left -
        containerRect.left +
        SCALE_WIDTH / 2 -
        ITEM_SIZE / 2;

      const baseY = scaleRect.top - containerRect.top - 75;
      const newY = item.id === 1 ? baseY + (item.topOffset ?? 0) : baseY;

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, x: newX, y: newY } : i
        )
      );

      setTimeout(() => {
        setIsAnimating(false);
      }, 1200);
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
    const correct =
      scaleWeight !== null && userWeight === scaleWeight;

    if (correct) {
      toast.success("Правильно!", {
        position: "top-right",
        duration: 1500,
      });

      const currentItem = items.find(
        (item) => item.weight === scaleWeight
      );

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
        alt="Market"
        width={1200}
        height={800}
        className="object-contain"
        priority
      />

      <div className="absolute w-full h-full flex justify-center items-start pt-[200px]">
        <div
          ref={containerRef}
          className="relative w-[1200px] h-[400px]"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="absolute cursor-grab z-20 transition-transform duration-500"
              style={{
                left: `${item.x}px`,
                top: `${item.y}px`,
                width: `${ITEM_SIZE}px`,
                height: `${ITEM_SIZE}px`,
              }}
              onMouseDown={(e) =>
                handleMouseDown(e, item.id)
              }
            >
              <Image
                src={item.ImgUrl}
                alt={item.name}
                width={ITEM_SIZE}
                height={ITEM_SIZE}
                draggable={false}
              />

              {/* 👇 кг чыгат */}
              {weighedItems.has(item.id) && (
                <div className="absolute bottom-[-25px] left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded-md text-sm font-bold shadow-md">
                  {item.weight} кг
                </div>
              )}
            </div>
          ))}

          {/* Тараза */}
          <div
            ref={scaleRef}
            className="absolute bottom-10 right-20"
            style={{ width: SCALE_WIDTH, height: SCALE_HEIGHT }}
          >
            <Image
              src={scaleBase}
              alt="scale base"
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[110px]"
            />

            <div className="absolute bottom-[115px] left-1/2 -translate-x-1/2 transition-transform duration-500">
              <Image
                src={scalePlate}
                alt="plate"
                width={100}
                height={50}
              />
            </div>

            <div className="absolute bottom-[40px] left-1/2 -translate-x-1/2">
              <Image
                src={scalePointer}
                alt="pointer"
                width={3}
                height={60}
                className="transition-transform duration-500"
                style={{
                  transform: `rotate(${pointerAngle}deg)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 flex gap-2 items-center mt-4">
        <h1>
          {currentItem
            ? `Сколько весит ${currentItem.name}?`
            : "Положите предмет на весы"}
        </h1>

        <input
          ref={inputRef}
          type="text"
          className="px-3 py-2 border-2 rounded-lg w-[80px]"
          onKeyDown={(e) =>
            e.key === "Enter" && handleSubmit()
          }
        />
      </div>
    </div>
  );
};

export default Test;