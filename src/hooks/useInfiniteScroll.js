import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for infinite scroll functionality
 * @param {Array} items - All items to paginate
 * @param {Object} options - Configuration options
 * @param {number} options.itemsPerPage - Number of items to load per page
 * @param {number} options.initialPages - Number of pages to load initially
 * @returns {Object} - { displayItems, hasMore, loading, lastItemRef, reset }
 */
export const useInfiniteScroll = (items = [], { itemsPerPage = 6, initialPages = 2 } = {}) => {
  const [displayItems, setDisplayItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const observerRef = useRef(null);
  const itemsRef = useRef(items);
  const prevLengthRef = useRef(0);

  // Update items ref
  itemsRef.current = items;

  // Reset when items length changes (not on every reference change)
  useEffect(() => {
    const currentLength = items?.length || 0;

    if (currentLength === 0) {
      setDisplayItems([]);
      setPage(1);
      setHasMore(false);
      prevLengthRef.current = 0;
      return;
    }

    // Only reset if the items length actually changed or this is the first load
    if (prevLengthRef.current !== currentLength) {
      prevLengthRef.current = currentLength;

      // Load initial items
      const initialCount = Math.min(
        itemsPerPage * initialPages,
        Math.max(itemsPerPage, Math.ceil(currentLength / 2))
      );

      const initialItems = items.slice(0, initialCount);
      setDisplayItems(initialItems);
      setPage(Math.ceil(initialCount / itemsPerPage));
      setHasMore(currentLength > initialCount);
    }
  }, [items?.length, itemsPerPage, initialPages]);

  // Load more items
  const loadMore = useCallback(() => {
    const currentItems = itemsRef.current;
    if (!hasMore || loading || !currentItems.length) return;

    setLoading(true);

    // Simulate async loading for smoother UX
    setTimeout(() => {
      const endIndex = (page + 1) * itemsPerPage;
      const nextItems = currentItems.slice(0, endIndex);

      if (nextItems.length === currentItems.length) {
        setHasMore(false);
      } else {
        setPage((prevPage) => prevPage + 1);
      }

      setDisplayItems(nextItems);
      setLoading(false);
    }, 300);
  }, [page, hasMore, loading, itemsPerPage]);

  // Intersection Observer callback for last item
  const lastItemRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        {
          rootMargin: '200px',
          threshold: 0.1,
        }
      );

      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, loadMore]
  );

  // Reset function to allow manual reset
  const reset = useCallback(() => {
    setPage(1);
    setDisplayItems([]);
    setHasMore(true);
    setLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    displayItems,
    hasMore,
    loading,
    lastItemRef,
    reset,
  };
};
