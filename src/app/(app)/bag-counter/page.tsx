"use client";

import { useEffect, useState, useCallback } from "react";

interface Loader {
  APP_ID: number;
  APP_NAME: string;
  API_URL: string;
  STREAMING_URL: string;
}

interface LiveData {
  Truckno?: string | number;
  SetValue?: string | number;
  Actual?: string | number;
  AddBagVal?: string | number;
  CLASS_COUNTS?: unknown;
  CLASS_TARGETS?: unknown;
}

interface TruckSequence {
  TRANS_ID: number;
  WAGON_NO: number;
  BOX_NO: string;
  LOADER_NO: string;
  SET_VALUE: number | string;
  ACTUAL_COUNT: number | string | null;
  STATUS: string | null;
  START_TIME: string | null;
  END_TIME: string | null;
  CREATED_AT: string | null;
  SHIPMENT_COUNT: number;
  TOTAL_SET_VALUE: number;
}

export default function BagCounterPage() {
  const [loaders, setLoaders] = useState<Loader[]>([]);
  const [selectedLoader, setSelectedLoader] = useState<Loader | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddTruck, setShowAddTruck] = useState(false);
  const [wagonNumber, setWagonNumber] = useState("");
  const [boxNumber, setBoxNumber] = useState("");
  const [destination, setDestination] = useState("");
  const [materialCode, setMaterialCode] = useState("");
  const [destinations, setDestinations] = useState<
    { RECORD_ID: number; DESTINATION: string }[]
  >([]);

  const [materials, setMaterials] = useState<
    { MATERIAL_CODE: string; MATERIAL_NAME: string }[]
  >([]);
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [liveError, setLiveError] = useState("");
  const [loaderNo, setLoaderNo] = useState("1");
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [tripError, setTripError] = useState("");
  const [createdTripId, setCreatedTripId] = useState<number | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [setValue, setSetValue] = useState("");
  const [addingItem, setAddingItem] = useState(false);
  const [addItemError, setAddItemError] = useState("");

  const [addBagValue, setAddBagValue] = useState("");
  const [isEditingAddBag, setIsEditingAddBag] = useState(false);
  const [addBagMessage, setAddBagMessage] = useState("");
  const [addBagStatus, setAddBagStatus] = useState("");

  const [targetValue, setTargetValue] = useState("");
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetMessage, setTargetMessage] = useState("");
  const [targetStatus, setTargetStatus] = useState("");

  const [queuedTruckNo, setQueuedTruckNo] = useState("");
  const [queuedSetValue, setQueuedSetValue] = useState<number | null>(null);
  const [truckSequence, setTruckSequence] = useState<TruckSequence[]>([]);
  const [sequenceLoading, setSequenceLoading] = useState(false);
  const [sequenceError, setSequenceError] = useState("");
  const [selectedTruckId, setSelectedTruckId] = useState<number | null>(null);
  const [resetting, setResetting] = useState(false);
  const [assignedTruckDetails, setAssignedTruckDetails] = useState<{
    DESTINATION: string | null;
    MATERIAL_CODE: string | null;
    MATERIAL_NAME: string | null;
  } | null>(null);

  const fetchTruckSequence = useCallback(async () => {
    if (!selectedLoader) return;

    setSequenceLoading(true);
    setSequenceError("");

    try {
      const response = await fetch(
        `/api/bag-counter/truck-sequence?loaderNo=${selectedLoader.APP_ID}`,
        { cache: "no-store" },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load truck sequence");
      }

      setTruckSequence(data.trucks);
    } catch (error) {
      setSequenceError(
        error instanceof Error
          ? error.message
          : "Unable to load truck sequence",
      );
    } finally {
      setSequenceLoading(false);
    }
  }, [selectedLoader]);

  useEffect(() => {
    if (!isEditingAddBag) {
      setAddBagValue(String(liveData?.AddBagVal ?? 0));
    }
  }, [liveData?.AddBagVal, isEditingAddBag]);

  useEffect(() => {
    if (!isEditingTarget) {
      setTargetValue(String(liveData?.SetValue ?? 0));
    }
  }, [liveData?.SetValue, isEditingTarget]);

  useEffect(() => {
    async function fetchDropdowns() {
      try {
        const [destinationResponse, materialResponse] = await Promise.all([
          fetch("/api/bag-counter/destinations"),
          fetch("/api/bag-counter/materials"),
        ]);

        const destinationData = await destinationResponse.json();
        const materialData = await materialResponse.json();

        if (destinationData.success) {
          setDestinations(destinationData.destinations);
        }

        if (materialData.success) {
          setMaterials(materialData.materials);
        }
      } catch (error) {
        console.error("Unable to load dropdowns:", error);
      }
    }

    fetchDropdowns();
  }, []);

  useEffect(() => {
    async function fetchLoaders() {
      try {
        const response = await fetch("/api/bag-counter/loaders");
        const data = await response.json();

        if (data.success && data.loaders) {
          setLoaders(data.loaders);
          if (data.loaders.length > 0) {
            setSelectedLoader(data.loaders[0]);
          }
        }
      } catch (error) {
        console.error("Unable to load loaders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLoaders();
  }, []);

  useEffect(() => {
    if (!selectedLoader) return;

    // Loader 2 is currently dummy data.
    if (!loaders.some((loader) => loader.APP_ID === selectedLoader.APP_ID)) {
      setLiveData(null);
      setLiveError("Dummy loader - no live connection");
      return;
    }

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    async function fetchLiveData() {
      try {
        const response = await fetch(
          `/api/bag-counter/live/${selectedLoader!.APP_ID}`,
          { cache: "no-store" },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to fetch live data");
        }

        if (active) {
          setLiveData(result.data);
          setLiveError("");
        }
      } catch (error) {
        if (active) {
          setLiveError(
            error instanceof Error ? error.message : "Live connection failed",
          );
        }
      } finally {
        if (active) {
          timer = setTimeout(fetchLiveData, 5000);
        }
      }
    }

    setLiveData(null);
    setLiveError("");
    fetchLiveData();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedLoader, loaders]);

  useEffect(() => {
    if (!selectedLoader) return;

    setSelectedTruckId(null);
    fetchTruckSequence();
  }, [selectedLoader, fetchTruckSequence]);

  // async function openAddTruck() {
  //   setShowAddTruck(true);

  //   setWagonNumber("");
  //   setBoxNumber("");
  //   setDestination("");
  //   setMaterialCode("");

  //   setTruckNumber("");
  //   setLoaderNo(String(selectedLoader?.APP_ID ?? 1));
  //   setTripError("");

  //   // Keep the existing internal trip number generation
  //   // because the current backend still expects TRIP_NO.
  //   try {
  //     const response = await fetch("/api/bag-counter/trips");
  //     const data = await response.json();

  //     if (!response.ok || !data.success) {
  //       throw new Error(data.message || "Unable to generate trip number");
  //     }

  //     setTripNo(String(data.nextTripNo));
  //   } catch (error) {
  //     setTripError(
  //       error instanceof Error
  //         ? error.message
  //         : "Unable to generate trip number",
  //     );
  //   }
  // }

  function openAddTruck() {
    setShowAddTruck(true);

    setWagonNumber("");
    setBoxNumber("");
    setDestination("");
    setMaterialCode("");
    setLoaderNo(String(selectedLoader?.APP_ID ?? 1));
    setTripError("");
  }

  async function createTrip() {
    if (
      !wagonNumber.trim() ||
      !boxNumber.trim() ||
      !destination ||
      !materialCode ||
      !loaderNo
    ) {
      setTripError("Please fill in all fields.");
      return;
    }

    const wagonNo = Number(wagonNumber);

    if (!Number.isSafeInteger(wagonNo) || wagonNo <= 0) {
      setTripError("Enter a valid numeric Wagon Number.");
      return;
    }

    setCreatingTrip(true);
    setTripError("");

    try {
      const response = await fetch("/api/bag-counter/trips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          WAGON_NO: wagonNo,
          BOX_NO: boxNumber.trim(),
          DESTINATION: destination,
          MATERIAL_CODE: materialCode,
          LOADER_NO: Number(loaderNo),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to create trip");
      }

      if (!data.TRANS_ID) {
        throw new Error("Trip created, but transaction ID was not returned.");
      }

      setCreatedTripId(Number(data.TRANS_ID));
      setShowAddTruck(false);

      setSetValue("");
      setAddItemError("");
      setShowAddItem(true);

      const selected = loaders.find(
        (loader) => loader.APP_ID === Number(loaderNo),
      );

      setSelectedLoader(
        selected ?? {
          APP_ID: Number(loaderNo),
          APP_NAME: `LINE-${loaderNo}`,
          API_URL: "",
          STREAMING_URL: "",
        },
      );
    } catch (error) {
      setTripError(
        error instanceof Error ? error.message : "Unable to create trip",
      );
    } finally {
      setCreatingTrip(false);
    }
  }

  async function addItem() {
    if (!createdTripId) {
      setAddItemError("No trip selected. Please create a trip first.");
      return;
    }

    const target = Number(setValue);

    if (!Number.isInteger(target) || target <= 0) {
      setAddItemError("Enter a valid Set Value.");
      return;
    }

    if (!materialCode) {
      setAddItemError("Please select a material.");
      return;
    }

    setAddingItem(true);
    setAddItemError("");

    try {
      const response = await fetch("/api/bag-counter/trips/add-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          TRANS_ID: createdTripId,
          MATERIAL_CODE: materialCode,
          SKU_DESCRIPTION:
            materials.find((item) => item.MATERIAL_CODE === materialCode)
              ?.MATERIAL_NAME ?? "",
          SET_VALUE: target,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to add item");
      }

      setQueuedTruckNo(data.TRUCK_NO);
      setQueuedSetValue(Number(data.SET_VALUE));

      await fetchTruckSequence();

      setShowAddItem(false);
      setCreatedTripId(null);
      setSetValue("");
      setMaterialCode("");

      alert("Item added successfully!");
    } catch (error) {
      setAddItemError(
        error instanceof Error ? error.message : "Unable to add item",
      );
    } finally {
      setAddingItem(false);
    }
  }

  async function resetCounter() {
    if (!selectedLoader) {
      alert("Please select a loader.");
      return;
    }

    const message =
      selectedTruckId !== null
        ? "Assign the selected truck and reset the counter?"
        : "Reset the current counter without assigning a truck?";

    if (!window.confirm(message)) {
      return;
    }

    setResetting(true);

    try {
      const response = await fetch("/api/bag-counter/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loaderNo: selectedLoader.APP_ID,
          selectedTransId: selectedTruckId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Reset failed");
      }

      // Update Destination and Material after assigning a truck
      if (data.truck) {
        setAssignedTruckDetails({
          DESTINATION: data.truck.DESTINATION ?? null,
          MATERIAL_CODE: data.truck.MATERIAL_CODE ?? null,
          MATERIAL_NAME: data.truck.MATERIAL_NAME ?? null,
        });
      }

      alert(data.message);

      setSelectedTruckId(null);
      setQueuedTruckNo("");
      setQueuedSetValue(null);

      await fetchTruckSequence();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Unable to reset counter");
    } finally {
      setResetting(false);
    }
  }

  async function handleAddBagUpdate() {
    if (!selectedLoader) {
      setAddBagStatus("error");
      setAddBagMessage("Please select a loader");
      return;
    }

    const value = Number(addBagValue);

    if (!Number.isFinite(value) || value < 0) {
      setAddBagStatus("error");
      setAddBagMessage("Enter a valid Add Bag value");
      return;
    }

    try {
      const response = await fetch("/api/bag-counter/add-bag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          LoaderNo: selectedLoader.APP_ID,
          Value: value,
        }),
      });

      const result = await response.json();

      setAddBagStatus(response.ok ? "success" : "error");
      setAddBagMessage(result.message || "No response message");

      // if (response.ok) {
      //   setLiveData((previous) =>
      //     previous ? { ...previous, AddBagVal: value } : previous,
      //   );
      // }
    } catch (error) {
      setAddBagStatus("error");
      setAddBagMessage("Unable to update Add Bag value");
    } finally {
      setIsEditingAddBag(false);
    }
  }

  async function handleTargetUpdate() {
    if (!selectedLoader) {
      setTargetStatus("error");
      setTargetMessage("Please select a loader");
      return;
    }

    const value = Number(targetValue);

    if (!Number.isInteger(value) || value <= 0) {
      setTargetStatus("error");
      setTargetMessage("Enter a valid Set Value");
      return;
    }

    try {
      const response = await fetch("/api/bag-counter/set-target", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          LoaderNo: selectedLoader.APP_ID,
          Value: value,
        }),
      });

      const result = await response.json();

      setTargetStatus(response.ok ? "success" : "error");
      setTargetMessage(result.message || "No response message");

      if (response.ok) {
        setLiveData((previous) =>
          previous ? { ...previous, SetValue: value } : previous,
        );
      }
    } catch (error) {
      setTargetStatus("error");
      setTargetMessage("Unable to update Set Value");
    } finally {
      setIsEditingTarget(false);
    }
  }

  return (
    <div className="space-y-3 text-gray-900">
      {/* Page Header */}
      <div  className="h-10 px-5 rounded-md bg-[#68458a] text-white font-semibold disabled:opacity-60">
        <h1 className="text-lg font-bold">Bag Counter</h1>
      </div>
      {/* Loader Selection
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {loading ? (
            <span className="text-sm text-gray-500">Loading loaders...</span>
          ) : (
            [1, 2].map((loaderNumber) => {
              const loader = loaders[loaderNumber - 1];

              return (
                <button
                  key={loaderNumber}
                  onClick={() => {
                    if (loader) {
                      setSelectedLoader(loader);
                    }
                  }}
                  className={`rounded px-4 py-2 text-sm font-semibold ${
                    selectedLoader?.APP_ID === loader?.APP_ID
                      ? "bg-[#082653] text-white"
                      : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                  }`}
                >
                  LOADER-{loaderNumber}
                </button>
              );
            })
          )}
        </div>

        <button
          onClick={() => setShowAddTruck(true)}
          className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600">
          Add Truck
        </button>
      </div> */}
      {/* Loader Selection */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {[1, 2].map((number) => (
            <button
              key={number}
              onClick={() => {
                setSelectedLoader(
                  loaders[number - 1] ?? {
                    APP_ID: number,
                    APP_NAME: `LINE-${number}`,
                    API_URL: "",
                    STREAMING_URL: "",
                  },
                );
              }}
              className={`rounded px-4 py-2 text-sm font-semibold ${
                selectedLoader?.APP_ID === number
                  ? "bg-[#68458a] text-white"
                  : "bg-gray-300 text-gray-800 hover:bg-gray-400"
              }`}
            >
              LOADER-{number}
            </button>
          ))}
        </div>

        <button
          onClick={openAddTruck}
          className="rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
        >
          Add Truck
        </button>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[2fr_1fr]">
        {/* Camera Stream */}
        <div className="overflow-hidden rounded-md border border-gray-300">
          <div className="bg-[#68458a] px-4 py-2 text-white">
            {selectedLoader?.APP_NAME || "Camera"} Live
          </div>

          <div className="flex h-[500px] items-center justify-center bg-[#222629]">
            {selectedLoader?.STREAMING_URL ? (
              <iframe
                key={selectedLoader.APP_ID}
                src={selectedLoader.STREAMING_URL}
                title="Camera Stream"
                className="h-full min-h-[500px] w-full border-0"
                allowFullScreen
              />
            ) : (
              <p className="text-gray-400">Camera feed will appear here.</p>
            )}
          </div>
        </div>
        {/* Loader Details */}
        <div className="flex flex-col self-start rounded-md border border-gray-300 bg-white">
          <div className="bg-[#68458a] px-4 py-2 text-white">
            {selectedLoader?.APP_NAME || "Loader Details"}
          </div>
          <div className="flex flex-col gap-5 p-4">
            {/* Counter Values */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm">Set Value</label>

                <input
                  type="number"
                  min="1"
                  value={targetValue}
                  onFocus={() => setIsEditingTarget(true)}
                  onChange={(e) => setTargetValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTargetUpdate();
                    }
                  }}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-center"
                />

                {targetMessage && (
                  <p
                    className={`mt-1 text-sm ${
                      targetStatus === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {targetStatus === "success" ? "Success: " : "Failed: "}
                    {targetMessage}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm">Actual</label>
                <div className="rounded border border-black bg-black px-3 py-2 text-center font-bold text-white">
                  {liveData?.Actual ?? "--"}
                </div>
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-sm">Box Number</label>
                <div className="rounded border border-gray-300 px-3 py-2">
                  {/* {queuedTruckNo || liveData?.Truckno || "--"} */}
                  {liveData?.Truckno || "--"}
                </div>
              </div>
            </div>

            {liveError && (
              <p className="mt-2 text-xs text-red-600">{liveError}</p>
            )}

            {/* Selected Truck Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm">Destination</label>
                <div className="rounded border border-gray-300 px-3 py-2">
                  {assignedTruckDetails?.DESTINATION || "--"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm">Material</label>
                <div className="rounded border border-gray-300 px-3 py-2">
                  {assignedTruckDetails?.MATERIAL_CODE
                    ? `${assignedTruckDetails.MATERIAL_CODE} - ${assignedTruckDetails.MATERIAL_NAME || ""}`
                    : "--"}
                </div>
              </div>

              {/* ADD BAG VALUE */}
              <div className="col-span-2">
                <label className="mb-1 block text-sm">Add Bag Value</label>

                <input
                  type="number"
                  min="0"
                  value={addBagValue}
                  onFocus={() => setIsEditingAddBag(true)}
                  onChange={(e) => setAddBagValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddBagUpdate();
                    }
                  }}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-center"
                />

                {addBagMessage && (
                  <p
                    className={`mt-1 text-sm ${
                      addBagStatus === "success"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {addBagStatus === "success" ? "Success: " : "Failed: "}
                    {addBagMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={resetCounter}
                disabled={resetting}
                className="rounded bg-gray-800 px-4 py-1.5 text-white hover:bg-black disabled:opacity-50"
              >
                {resetting ? "Resetting..." : "Reset"}
              </button>
            </div>

            {/* Truck Sequence */}
            <div className="mt-5 border-t border-gray-300 pt-4">
              <div className="mb-2 flex items-center justify-between rounded bg-gray-200 px-2 py-2">
                <h2 className="font-medium">Truck Sequence</h2>

                <button
                  onClick={fetchTruckSequence}
                  disabled={sequenceLoading}
                  className="rounded bg-green-700 px-3 py-1 text-sm text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {sequenceLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="h-[260px] overflow-y-auto overflow-x-auto rounded border border-gray-200">
                <table className="w-full text-center text-sm">
                  <thead className="sticky top-0 z-10 bg-gray-100">
                    <tr className="border-b border-gray-300">
                      <th className="px-2 py-2">S No</th>
                      <th className="px-2 py-2">Wagon No</th>
                      <th className="px-2 py-2">Box No</th>
                      <th className="px-2 py-2">Set Value</th>
                      <th className="px-2 py-2">Select</th>
                    </tr>
                  </thead>

                  <tbody>
                    {sequenceError ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-red-600">
                          {sequenceError}
                        </td>
                      </tr>
                    ) : sequenceLoading && truckSequence.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-gray-500">
                          Loading trucks...
                        </td>
                      </tr>
                    ) : truckSequence.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-gray-500">
                          No trucks found for this loader.
                        </td>
                      </tr>
                    ) : (
                      truckSequence.map((truck, index) => (
                        <tr
                          key={truck.TRANS_ID}
                          className={`border-b border-gray-200 ${
                            selectedTruckId === truck.TRANS_ID
                              ? "bg-blue-50"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-2 py-2">{index + 1}</td>

                          <td className="px-2 py-2">{truck.WAGON_NO}</td>
                          <td className="px-2 py-2">{truck.BOX_NO}</td>

                          <td className="px-2 py-2">{truck.TOTAL_SET_VALUE}</td>

                          <td className="px-2 py-2">
                            <input
                              type="radio"
                              name="truckSequence"
                              checked={selectedTruckId === truck.TRANS_ID}
                              onChange={() =>
                                setSelectedTruckId(truck.TRANS_ID)
                              }
                            />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>{" "}
          {/* Inner Loader Details content */}
        </div>{" "}
        {/* Loader Details */}
      </div>{" "}
      {/* Main Content grid */}
      {/* Add Truck Modal */}
      {/* Add Truck Modal */}
      {showAddTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-gray-800">Add Truck</h2>

            <div className="space-y-4">
              {/* Wagon Number */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Wagon Number
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={wagonNumber}
                  onChange={(e) => setWagonNumber(e.target.value)}
                  placeholder="Enter wagon number"
                  className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              {/* Box Number */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Box Number
                </label>
                <input
                  type="text"
                  value={boxNumber}
                  onChange={(e) => setBoxNumber(e.target.value)}
                  placeholder="Enter box number"
                  className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="">
                    {destinations.length === 0
                      ? "No destinations available yet"
                      : "Select Destination"}
                  </option>

                  {destinations.map((item) => (
                    <option key={item.RECORD_ID} value={item.DESTINATION}>
                      {item.DESTINATION}
                    </option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Material
                </label>
                <select
                  value={materialCode}
                  onChange={(e) => setMaterialCode(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="">
                    {materials.length === 0
                      ? "No materials available yet"
                      : "Select Material"}
                  </option>

                  {materials.map((item, index) => (
                    <option
                      key={`${item.MATERIAL_CODE}-${index}`}
                      value={item.MATERIAL_CODE}
                    >
                      {item.MATERIAL_CODE} - {item.MATERIAL_NAME}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loader */}
              <div>
                <label className="mb-1 block text-sm font-medium">Loader</label>
                <select
                  value={loaderNo}
                  onChange={(e) => setLoaderNo(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-3 py-2"
                >
                  <option value="1">Loader 1</option>
                  <option value="2">Loader 2</option>
                </select>
              </div>

              {tripError && <p className="text-sm text-red-600">{tripError}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddTruck(false);
                    setTripError("");
                  }}
                  className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={createTrip}
                  disabled={creatingTrip}
                  className="rounded bg-[#68458a] px-5 py-2 text-white bg-[#7824c7] disabled:opacity-50"
                >
                  {creatingTrip ? "Creating..." : "Create Trip"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="mb-5 text-lg font-bold text-gray-800">Add Item</h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Set Value
                </label>

                <input
                  type="number"
                  min="1"
                  value={setValue}
                  onChange={(e) => setSetValue(e.target.value)}
                  placeholder="Enter target value"
                  className="w-full rounded border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>

              {addItemError && (
                <p className="text-sm text-red-600">{addItemError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowAddItem(false);
                    setAddItemError("");
                  }}
                  disabled={addingItem}
                  className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={addItem}
                  disabled={addingItem || !setValue}
                  className="rounded bg-[#68458a] px-5 py-2 text-white bg-[#8e33e4] disabled:opacity-50"
                >             
                  {addingItem ? "Adding..." : "Add Item"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
