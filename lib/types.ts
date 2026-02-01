export interface XtreamLoginResponse {
  user_info: {
    username: string;
    password: string;
    message: string;
    auth: number;
    status: string;
    exp_date: string;
    is_trial: string;
    active_cons: string;
    created_at: string;
    max_connections: string;
    allowed_output_formats: string[];
  };
  server_info: {
    url: string;
    port: string;
    https_port: string;
    server_protocol: string;
    rtmp_port: string;
    timezone: string;
    timestamp_now: number;
    time_now: string;
  };
}

export interface XtreamCategory {
  category_id: string;
  category_name: string;
  parent_id: number;
}

export interface XtreamStream {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string;
  added: string;
  category_id: string;
  custom_sid: string;
  tv_archive: number;
  direct_source: string;
  tv_archive_duration: number;
  container_extension?: string;
}

export interface XtreamSeries {
  series_id: number;
  name: string;
  cover: string;
  category_id: string;
  plot?: string;
  cast?: string;
  director?: string;
  genre?: string;
  releaseDate?: string;
  last_modified?: string;
  rating?: string;
}

export interface XtreamEpisode {
  id: string;
  episode_num: string | number;
  title: string;
  container_extension?: string;
  info?: {
    movie_image?: string;
    plot?: string;
    duration?: string;
    rating?: string;
  };
  custom_sid?: string;
  added?: string;
  season?: number;
  direct_source?: string;
}

export interface XtreamSeason {
  air_date: string;
  episode_count: number;
  id: number;
  name: string;
  overview: string;
  season_number: number;
  cover: string;
  cover_big: string;
}

export interface XtreamSeriesInfo {
  seasons: XtreamSeason[];
  episodes: { [key: string]: XtreamEpisode[] };
  info: {
    name: string;
    cover: string;
    plot: string;
    cast: string;
    director: string;
    genre: string;
    releaseDate: string;
    last_modified: string;
    rating: string;
    rating_5based: number;
    backdrop_path: string[];
    youtube_trailer: string;
    episode_run_time: string;
    category_id: string;
  };
}

export interface XtreamVodInfo {
  info: {
    name: string;
    o_name?: string;
    cover_big?: string;
    movie_image?: string;
    releasedate?: string;
    episode_run_time?: string;
    youtube_trailer?: string;
    director?: string;
    actors?: string;
    cast?: string;
    description?: string;
    plot?: string;
    age?: string;
    rating?: string;
    rating_5based?: number;
    country?: string;
    genre?: string;
    duration?: string;
    video?: {
      duration_secs?: number;
      duration?: string;
    };
    audio?: {
      bitrate?: string;
      channels?: number;
    };
    bitrate?: number;
  };
  movie_data?: {
    stream_id: number;
    name: string;
    added: string;
    category_id: string;
    container_extension: string;
    custom_sid: string;
    direct_source: string;
  };
}

export interface XtreamEpgListing {
  id: string;
  epg_id: string;
  title: string;
  lang: string;
  start: string;
  end: string;
  description: string;
  channel_id: string;
  start_timestamp: string | number;
  stop_timestamp: string | number;
}

export interface XtreamEpgShortResponse {
  epg_listings: XtreamEpgListing[];
}

// Optimized Types for Client
export interface Category {
  id: string;
  name: string;
}

export interface Channel {
  id: number;
  name: string;
  logo: string;
  group_id: string;
  url?: string; // Constructed client-side or server-side
  stream_type?: 'live' | 'movie' | 'series';
  extension?: string;
}
