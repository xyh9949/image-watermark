// 图片管理状态

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ImageInfo, ProcessingStatus, BatchTask, WatermarkConfig } from '@/app/types';

// 图片状态接口
export interface ImageState {
  // 图片列表
  images: ImageInfo[];
  selectedImageIds: string[];
  currentImageId: string | null;
  
  // 处理状态
  processingTasks: Record<string, ProcessingStatus>;
  batchTasks: BatchTask[];
  
  // UI状态
  isUploading: boolean;
  uploadProgress: number;
  dragOver: boolean;
  
  // 操作方法
  addImages: (files: File[]) => Promise<void>;
  removeImage: (imageId: string) => void;
  removeImages: (imageIds: string[]) => void;
  clearImages: () => void;
  
  // 选择操作
  selectImage: (imageId: string) => void;
  selectImages: (imageIds: string[]) => void;
  selectAllImages: () => void;
  clearSelection: () => void;
  toggleImageSelection: (imageId: string) => void;
  
  // 当前图片操作
  setCurrentImage: (imageId: string | null) => void;
  getCurrentImage: () => ImageInfo | null;
  getSelectedImages: () => ImageInfo[];
  
  // 图片信息更新
  updateImageInfo: (imageId: string, updates: Partial<ImageInfo>) => void;
  updateImageStatus: (imageId: string, status: ImageInfo['status'], error?: string) => void;
  updateUploadProgress: (imageId: string, progress: number) => void;
  
  // 处理状态管理
  addProcessingTask: (task: ProcessingStatus) => void;
  updateProcessingTask: (imageId: string, updates: Partial<ProcessingStatus>) => void;
  removeProcessingTask: (imageId: string) => void;
  getProcessingTask: (imageId: string) => ProcessingStatus | null;
  
  // 批量任务管理
  createBatchTask: (name: string, imageIds: string[]) => string;
  updateBatchTask: (taskId: string, updates: Partial<BatchTask>) => void;
  removeBatchTask: (taskId: string) => void;
  getBatchTask: (taskId: string) => BatchTask | null;
  
  // 拖拽状态
  setDragOver: (dragOver: boolean) => void;
  
  // 工具方法
  getImageById: (imageId: string) => ImageInfo | null;
  getImagesByIds: (imageIds: string[]) => ImageInfo[];
  getTotalSize: () => number;
  getImageCount: () => number;
  hasImages: () => boolean;
  hasSelectedImages: () => boolean;
}

// 创建图片ID
const createImageId = () => crypto.randomUUID();

// 创建图片信息
const createImageInfo = (file: File): ImageInfo => ({
  id: createImageId(),
  file,
  name: file.name,
  size: file.size,
  type: file.type,
  width: 0,
  height: 0,
  url: '',
  uploadProgress: 0,
  status: 'uploading',
});

// 获取图片尺寸
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 });
    };
    
    img.src = url;
  });
};

// 创建图片状态管理
export const useImageStore = create<ImageState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      images: [],
      selectedImageIds: [],
      currentImageId: null,
      processingTasks: {},
      batchTasks: [],
      isUploading: false,
      uploadProgress: 0,
      dragOver: false,

      // 添加图片
      addImages: async (files) => {
        set({ isUploading: true, uploadProgress: 0 });
        
        const newImages: ImageInfo[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const imageInfo = createImageInfo(file);
          
          // 获取图片尺寸
          const dimensions = await getImageDimensions(file);
          imageInfo.width = dimensions.width;
          imageInfo.height = dimensions.height;
          
          // 创建预览URL
          imageInfo.url = URL.createObjectURL(file);
          imageInfo.status = 'uploaded';
          imageInfo.uploadProgress = 100;
          
          newImages.push(imageInfo);
          
          // 更新进度
          const progress = ((i + 1) / files.length) * 100;
          set({ uploadProgress: progress });
        }
        
        set((state) => ({
          images: [...state.images, ...newImages],
          isUploading: false,
          uploadProgress: 100,
        }));
        
        // 如果没有当前选中的图片，选中第一张
        const state = get();
        if (!state.currentImageId && newImages.length > 0) {
          set({ currentImageId: newImages[0].id });
        }
      },

      // 移除图片
      removeImage: (imageId) => {
        set((state) => {
          const image = state.images.find(img => img.id === imageId);
          if (image?.url) {
            URL.revokeObjectURL(image.url);
          }
          
          return {
            images: state.images.filter(img => img.id !== imageId),
            selectedImageIds: state.selectedImageIds.filter(id => id !== imageId),
            currentImageId: state.currentImageId === imageId ? null : state.currentImageId,
          };
        });
      },

      // 移除多张图片
      removeImages: (imageIds) => {
        set((state) => {
          // 清理URL
          imageIds.forEach(imageId => {
            const image = state.images.find(img => img.id === imageId);
            if (image?.url) {
              URL.revokeObjectURL(image.url);
            }
          });
          
          return {
            images: state.images.filter(img => !imageIds.includes(img.id)),
            selectedImageIds: state.selectedImageIds.filter(id => !imageIds.includes(id)),
            currentImageId: imageIds.includes(state.currentImageId!) ? null : state.currentImageId,
          };
        });
      },

      // 清空图片
      clearImages: () => {
        const state = get();
        // 清理所有URL
        state.images.forEach(image => {
          if (image.url) {
            URL.revokeObjectURL(image.url);
          }
        });
        
        set({
          images: [],
          selectedImageIds: [],
          currentImageId: null,
          processingTasks: {},
        });
      },

      // 选择图片
      selectImage: (imageId) => {
        set({ selectedImageIds: [imageId] });
      },

      // 选择多张图片
      selectImages: (imageIds) => {
        set({ selectedImageIds: imageIds });
      },

      // 选择所有图片
      selectAllImages: () => {
        const state = get();
        set({ selectedImageIds: state.images.map(img => img.id) });
      },

      // 清空选择
      clearSelection: () => {
        set({ selectedImageIds: [] });
      },

      // 切换图片选择状态
      toggleImageSelection: (imageId) => {
        set((state) => {
          const isSelected = state.selectedImageIds.includes(imageId);
          return {
            selectedImageIds: isSelected
              ? state.selectedImageIds.filter(id => id !== imageId)
              : [...state.selectedImageIds, imageId]
          };
        });
      },

      // 设置当前图片
      setCurrentImage: (imageId) => {
        set({ currentImageId: imageId });
      },

      // 获取当前图片
      getCurrentImage: () => {
        const state = get();
        return state.images.find(img => img.id === state.currentImageId) || null;
      },

      // 获取选中的图片
      getSelectedImages: () => {
        const state = get();
        return state.images.filter(img => state.selectedImageIds.includes(img.id));
      },

      // 更新图片信息
      updateImageInfo: (imageId, updates) => {
        set((state) => ({
          images: state.images.map(img =>
            img.id === imageId ? { ...img, ...updates } : img
          ),
        }));
      },

      // 更新图片状态
      updateImageStatus: (imageId, status, error) => {
        get().updateImageInfo(imageId, { status, error });
      },

      // 更新上传进度
      updateUploadProgress: (imageId, progress) => {
        get().updateImageInfo(imageId, { uploadProgress: progress });
      },

      // 添加处理任务
      addProcessingTask: (task) => {
        set((state) => ({
          processingTasks: {
            ...state.processingTasks,
            [task.imageId]: task,
          },
        }));
      },

      // 更新处理任务
      updateProcessingTask: (imageId, updates) => {
        set((state) => ({
          processingTasks: {
            ...state.processingTasks,
            [imageId]: {
              ...state.processingTasks[imageId],
              ...updates,
            },
          },
        }));
      },

      // 移除处理任务
      removeProcessingTask: (imageId) => {
        set((state) => {
          const { [imageId]: removed, ...rest } = state.processingTasks;
          return { processingTasks: rest };
        });
      },

      // 获取处理任务
      getProcessingTask: (imageId) => {
        const state = get();
        return state.processingTasks[imageId] || null;
      },

      // 创建批量任务
      createBatchTask: (name, imageIds) => {
        const taskId = typeof window !== 'undefined' && typeof crypto !== 'undefined'
          ? crypto.randomUUID()
          : `batch_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        const state = get();
        const images = state.images.filter(img => imageIds.includes(img.id));
        
        const batchTask: BatchTask = {
          id: taskId,
          name,
          images,
          watermarkConfig: {} as WatermarkConfig, // 将在实际使用时设置
          status: 'pending',
          progress: 0,
          createdAt: typeof window !== 'undefined' ? new Date() : new Date(0),
        };
        
        set((state) => ({
          batchTasks: [...state.batchTasks, batchTask],
        }));
        
        return taskId;
      },

      // 更新批量任务
      updateBatchTask: (taskId, updates) => {
        set((state) => ({
          batchTasks: state.batchTasks.map(task =>
            task.id === taskId ? { ...task, ...updates } : task
          ),
        }));
      },

      // 移除批量任务
      removeBatchTask: (taskId) => {
        set((state) => ({
          batchTasks: state.batchTasks.filter(task => task.id !== taskId),
        }));
      },

      // 获取批量任务
      getBatchTask: (taskId) => {
        const state = get();
        return state.batchTasks.find(task => task.id === taskId) || null;
      },

      // 设置拖拽状态
      setDragOver: (dragOver) => {
        set({ dragOver });
      },

      // 根据ID获取图片
      getImageById: (imageId) => {
        const state = get();
        return state.images.find(img => img.id === imageId) || null;
      },

      // 根据ID列表获取图片
      getImagesByIds: (imageIds) => {
        const state = get();
        return state.images.filter(img => imageIds.includes(img.id));
      },

      // 获取总大小
      getTotalSize: () => {
        const state = get();
        return state.images.reduce((total, img) => total + img.size, 0);
      },

      // 获取图片数量
      getImageCount: () => {
        const state = get();
        return state.images.length;
      },

      // 检查是否有图片
      hasImages: () => {
        const state = get();
        return state.images.length > 0;
      },

      // 检查是否有选中的图片
      hasSelectedImages: () => {
        const state = get();
        return state.selectedImageIds.length > 0;
      },
    }),
    {
      name: 'image-store',
    }
  )
);
