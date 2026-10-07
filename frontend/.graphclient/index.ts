// @ts-nocheck
import { GraphQLResolveInfo, SelectionSetNode, FieldNode, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
import { gql } from '@graphql-mesh/utils';

import type { GetMeshOptions } from '@graphql-mesh/runtime';
import type { YamlConfig } from '@graphql-mesh/types';
import { PubSub } from '@graphql-mesh/utils';
import { DefaultLogger } from '@graphql-mesh/utils';
import MeshCache from "@graphql-mesh/cache-localforage";
import { fetch as fetchFn } from '@whatwg-node/fetch';

import { MeshResolvedSource } from '@graphql-mesh/runtime';
import { MeshTransform, MeshPlugin } from '@graphql-mesh/types';
import GraphqlHandler from "@graphql-mesh/graphql"
import BareMerger from "@graphql-mesh/merger-bare";
import { printWithCache } from '@graphql-mesh/utils';
import { usePersistedOperations } from '@graphql-yoga/plugin-persisted-operations';
import { createMeshHTTPHandler, MeshHTTPHandler } from '@graphql-mesh/http';
import { getMesh, ExecuteMeshFn, SubscribeMeshFn, MeshContext as BaseMeshContext, MeshInstance } from '@graphql-mesh/runtime';
import { MeshStore, FsStoreStorageAdapter } from '@graphql-mesh/store';
import { path as pathModule } from '@graphql-mesh/cross-helpers';
import { ImportFn } from '@graphql-mesh/types';
import type { RefiMedellinUbiTypes } from './sources/refi-medellin-ubi/types';
import * as importedModule$0 from "./sources/refi-medellin-ubi/introspectionSchema";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };



/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigDecimal: { input: any; output: any; }
  BigInt: { input: any; output: any; }
  Bytes: { input: any; output: any; }
  Int8: { input: any; output: any; }
  Timestamp: { input: any; output: any; }
};

export type Aggregation_interval =
  | 'hour'
  | 'day';

export type Beneficiary = {
  id: Scalars['Bytes']['output'];
  totalClaimed: Scalars['BigInt']['output'];
  dateAdded: Scalars['BigInt']['output'];
  dateRemoved?: Maybe<Scalars['BigInt']['output']>;
  isActive: Scalars['Boolean']['output'];
};

export type Beneficiary_filter = {
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  totalClaimed?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalClaimed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dateAdded?: InputMaybe<Scalars['BigInt']['input']>;
  dateAdded_not?: InputMaybe<Scalars['BigInt']['input']>;
  dateAdded_gt?: InputMaybe<Scalars['BigInt']['input']>;
  dateAdded_lt?: InputMaybe<Scalars['BigInt']['input']>;
  dateAdded_gte?: InputMaybe<Scalars['BigInt']['input']>;
  dateAdded_lte?: InputMaybe<Scalars['BigInt']['input']>;
  dateAdded_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dateAdded_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dateRemoved?: InputMaybe<Scalars['BigInt']['input']>;
  dateRemoved_not?: InputMaybe<Scalars['BigInt']['input']>;
  dateRemoved_gt?: InputMaybe<Scalars['BigInt']['input']>;
  dateRemoved_lt?: InputMaybe<Scalars['BigInt']['input']>;
  dateRemoved_gte?: InputMaybe<Scalars['BigInt']['input']>;
  dateRemoved_lte?: InputMaybe<Scalars['BigInt']['input']>;
  dateRemoved_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  dateRemoved_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  isActive?: InputMaybe<Scalars['Boolean']['input']>;
  isActive_not?: InputMaybe<Scalars['Boolean']['input']>;
  isActive_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  isActive_not_in?: InputMaybe<Array<Scalars['Boolean']['input']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Beneficiary_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Beneficiary_filter>>>;
};

export type Beneficiary_orderBy =
  | 'id'
  | 'totalClaimed'
  | 'dateAdded'
  | 'dateRemoved'
  | 'isActive';

export type BlockChangedFilter = {
  number_gte: Scalars['Int']['input'];
};

export type Block_height = {
  hash?: InputMaybe<Scalars['Bytes']['input']>;
  number?: InputMaybe<Scalars['Int']['input']>;
  number_gte?: InputMaybe<Scalars['Int']['input']>;
};

export type DailyClaim = {
  id: Scalars['ID']['output'];
  date: Scalars['BigInt']['output'];
  totalClaims: Scalars['BigInt']['output'];
  totalAmount: Scalars['BigInt']['output'];
  beneficiaries: Array<Scalars['Bytes']['output']>;
};

export type DailyClaim_filter = {
  id?: InputMaybe<Scalars['ID']['input']>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_gt?: InputMaybe<Scalars['ID']['input']>;
  id_lt?: InputMaybe<Scalars['ID']['input']>;
  id_gte?: InputMaybe<Scalars['ID']['input']>;
  id_lte?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  date?: InputMaybe<Scalars['BigInt']['input']>;
  date_not?: InputMaybe<Scalars['BigInt']['input']>;
  date_gt?: InputMaybe<Scalars['BigInt']['input']>;
  date_lt?: InputMaybe<Scalars['BigInt']['input']>;
  date_gte?: InputMaybe<Scalars['BigInt']['input']>;
  date_lte?: InputMaybe<Scalars['BigInt']['input']>;
  date_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  date_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalClaims?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaims_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaims_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaims_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaims_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaims_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaims_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalClaims_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalAmount?: InputMaybe<Scalars['BigInt']['input']>;
  totalAmount_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalAmount_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAmount_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalAmount_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAmount_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalAmount_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalAmount_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  beneficiaries?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  beneficiaries_not?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  beneficiaries_contains?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  beneficiaries_contains_nocase?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  beneficiaries_not_contains?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  beneficiaries_not_contains_nocase?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<DailyClaim_filter>>>;
  or?: InputMaybe<Array<InputMaybe<DailyClaim_filter>>>;
};

export type DailyClaim_orderBy =
  | 'id'
  | 'date'
  | 'totalClaims'
  | 'totalAmount'
  | 'beneficiaries';

export type Funds = {
  id: Scalars['Bytes']['output'];
  totalSupplied: Scalars['BigInt']['output'];
  totalWithdrawn: Scalars['BigInt']['output'];
  totalClaimed: Scalars['BigInt']['output'];
  contractBalance: Scalars['BigInt']['output'];
};

export type Funds_filter = {
  id?: InputMaybe<Scalars['Bytes']['input']>;
  id_not?: InputMaybe<Scalars['Bytes']['input']>;
  id_gt?: InputMaybe<Scalars['Bytes']['input']>;
  id_lt?: InputMaybe<Scalars['Bytes']['input']>;
  id_gte?: InputMaybe<Scalars['Bytes']['input']>;
  id_lte?: InputMaybe<Scalars['Bytes']['input']>;
  id_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_not_in?: InputMaybe<Array<Scalars['Bytes']['input']>>;
  id_contains?: InputMaybe<Scalars['Bytes']['input']>;
  id_not_contains?: InputMaybe<Scalars['Bytes']['input']>;
  totalSupplied?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupplied_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupplied_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupplied_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupplied_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupplied_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalSupplied_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalSupplied_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalWithdrawn?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalWithdrawn_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalWithdrawn_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalClaimed?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_not?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_gt?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_lt?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_gte?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_lte?: InputMaybe<Scalars['BigInt']['input']>;
  totalClaimed_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  totalClaimed_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contractBalance?: InputMaybe<Scalars['BigInt']['input']>;
  contractBalance_not?: InputMaybe<Scalars['BigInt']['input']>;
  contractBalance_gt?: InputMaybe<Scalars['BigInt']['input']>;
  contractBalance_lt?: InputMaybe<Scalars['BigInt']['input']>;
  contractBalance_gte?: InputMaybe<Scalars['BigInt']['input']>;
  contractBalance_lte?: InputMaybe<Scalars['BigInt']['input']>;
  contractBalance_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  contractBalance_not_in?: InputMaybe<Array<Scalars['BigInt']['input']>>;
  /** Filter for the block changed event. */
  _change_block?: InputMaybe<BlockChangedFilter>;
  and?: InputMaybe<Array<InputMaybe<Funds_filter>>>;
  or?: InputMaybe<Array<InputMaybe<Funds_filter>>>;
};

export type Funds_orderBy =
  | 'id'
  | 'totalSupplied'
  | 'totalWithdrawn'
  | 'totalClaimed'
  | 'contractBalance';

/** Defines the order direction, either ascending or descending */
export type OrderDirection =
  | 'asc'
  | 'desc';

export type Query = {
  beneficiary?: Maybe<Beneficiary>;
  beneficiaries: Array<Beneficiary>;
  funds?: Maybe<Funds>;
  funds_collection: Array<Funds>;
  dailyClaim?: Maybe<DailyClaim>;
  dailyClaims: Array<DailyClaim>;
  /** Access to subgraph metadata */
  _meta?: Maybe<_Meta_>;
};


export type QuerybeneficiaryArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerybeneficiariesArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Beneficiary_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Beneficiary_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QueryfundsArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Queryfunds_collectionArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Funds_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<Funds_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerydailyClaimArgs = {
  id: Scalars['ID']['input'];
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type QuerydailyClaimsArgs = {
  skip?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<DailyClaim_orderBy>;
  orderDirection?: InputMaybe<OrderDirection>;
  where?: InputMaybe<DailyClaim_filter>;
  block?: InputMaybe<Block_height>;
  subgraphError?: _SubgraphErrorPolicy_;
};


export type Query_metaArgs = {
  block?: InputMaybe<Block_height>;
};

export type _Block_ = {
  /** The hash of the block */
  hash?: Maybe<Scalars['Bytes']['output']>;
  /** The block number */
  number: Scalars['Int']['output'];
  /** Integer representation of the timestamp stored in blocks for the chain */
  timestamp?: Maybe<Scalars['Int']['output']>;
  /** The hash of the parent block */
  parentHash?: Maybe<Scalars['Bytes']['output']>;
};

/** The type for the top-level _meta field */
export type _Meta_ = {
  /**
   * Information about a specific subgraph block. The hash of the block
   * will be null if the _meta field has a block constraint that asks for
   * a block number. It will be filled if the _meta field has no block constraint
   * and therefore asks for the latest  block
   *
   */
  block: _Block_;
  /** The deployment ID */
  deployment: Scalars['String']['output'];
  /** If `true`, the subgraph encountered indexing errors at some past block */
  hasIndexingErrors: Scalars['Boolean']['output'];
};

export type _SubgraphErrorPolicy_ =
  /** Data will be returned even if the subgraph has indexing errors */
  | 'allow'
  /** If the subgraph has indexing errors, data will be omitted. The default. */
  | 'deny';

export type WithIndex<TObject> = TObject & Record<string, any>;
export type ResolversObject<TObject> = WithIndex<TObject>;

export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type LegacyStitchingResolver<TResult, TParent, TContext, TArgs> = {
  fragment: string;
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};

export type NewStitchingResolver<TResult, TParent, TContext, TArgs> = {
  selectionSet: string | ((fieldNode: FieldNode) => SelectionSetNode);
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type StitchingResolver<TResult, TParent, TContext, TArgs> = LegacyStitchingResolver<TResult, TParent, TContext, TArgs> | NewStitchingResolver<TResult, TParent, TContext, TArgs>;
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>
  | StitchingResolver<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = ResolversObject<{
  Aggregation_interval: Aggregation_interval;
  Beneficiary: ResolverTypeWrapper<Beneficiary>;
  Beneficiary_filter: Beneficiary_filter;
  Beneficiary_orderBy: Beneficiary_orderBy;
  BigDecimal: ResolverTypeWrapper<Scalars['BigDecimal']['output']>;
  BigInt: ResolverTypeWrapper<Scalars['BigInt']['output']>;
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_height;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Bytes: ResolverTypeWrapper<Scalars['Bytes']['output']>;
  DailyClaim: ResolverTypeWrapper<DailyClaim>;
  DailyClaim_filter: DailyClaim_filter;
  DailyClaim_orderBy: DailyClaim_orderBy;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  Funds: ResolverTypeWrapper<Funds>;
  Funds_filter: Funds_filter;
  Funds_orderBy: Funds_orderBy;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Int8: ResolverTypeWrapper<Scalars['Int8']['output']>;
  OrderDirection: OrderDirection;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Timestamp: ResolverTypeWrapper<Scalars['Timestamp']['output']>;
  _Block_: ResolverTypeWrapper<_Block_>;
  _Meta_: ResolverTypeWrapper<_Meta_>;
  _SubgraphErrorPolicy_: _SubgraphErrorPolicy_;
}>;

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = ResolversObject<{
  Beneficiary: Beneficiary;
  Beneficiary_filter: Beneficiary_filter;
  BigDecimal: Scalars['BigDecimal']['output'];
  BigInt: Scalars['BigInt']['output'];
  BlockChangedFilter: BlockChangedFilter;
  Block_height: Block_height;
  Boolean: Scalars['Boolean']['output'];
  Bytes: Scalars['Bytes']['output'];
  DailyClaim: DailyClaim;
  DailyClaim_filter: DailyClaim_filter;
  Float: Scalars['Float']['output'];
  Funds: Funds;
  Funds_filter: Funds_filter;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  Int8: Scalars['Int8']['output'];
  Query: {};
  String: Scalars['String']['output'];
  Timestamp: Scalars['Timestamp']['output'];
  _Block_: _Block_;
  _Meta_: _Meta_;
}>;

export type entityDirectiveArgs = { };

export type entityDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = entityDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type subgraphIdDirectiveArgs = {
  id: Scalars['String']['input'];
};

export type subgraphIdDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = subgraphIdDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type derivedFromDirectiveArgs = {
  field: Scalars['String']['input'];
};

export type derivedFromDirectiveResolver<Result, Parent, ContextType = MeshContext, Args = derivedFromDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type BeneficiaryResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Beneficiary'] = ResolversParentTypes['Beneficiary']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  totalClaimed?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  dateAdded?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  dateRemoved?: Resolver<Maybe<ResolversTypes['BigInt']>, ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface BigDecimalScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigDecimal'], any> {
  name: 'BigDecimal';
}

export interface BigIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['BigInt'], any> {
  name: 'BigInt';
}

export interface BytesScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Bytes'], any> {
  name: 'Bytes';
}

export type DailyClaimResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['DailyClaim'] = ResolversParentTypes['DailyClaim']> = ResolversObject<{
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  date?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalClaims?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalAmount?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  beneficiaries?: Resolver<Array<ResolversTypes['Bytes']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type FundsResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Funds'] = ResolversParentTypes['Funds']> = ResolversObject<{
  id?: Resolver<ResolversTypes['Bytes'], ParentType, ContextType>;
  totalSupplied?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalWithdrawn?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  totalClaimed?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  contractBalance?: Resolver<ResolversTypes['BigInt'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export interface Int8ScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Int8'], any> {
  name: 'Int8';
}

export type QueryResolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = ResolversObject<{
  beneficiary?: Resolver<Maybe<ResolversTypes['Beneficiary']>, ParentType, ContextType, RequireFields<QuerybeneficiaryArgs, 'id' | 'subgraphError'>>;
  beneficiaries?: Resolver<Array<ResolversTypes['Beneficiary']>, ParentType, ContextType, RequireFields<QuerybeneficiariesArgs, 'skip' | 'first' | 'subgraphError'>>;
  funds?: Resolver<Maybe<ResolversTypes['Funds']>, ParentType, ContextType, RequireFields<QueryfundsArgs, 'id' | 'subgraphError'>>;
  funds_collection?: Resolver<Array<ResolversTypes['Funds']>, ParentType, ContextType, RequireFields<Queryfunds_collectionArgs, 'skip' | 'first' | 'subgraphError'>>;
  dailyClaim?: Resolver<Maybe<ResolversTypes['DailyClaim']>, ParentType, ContextType, RequireFields<QuerydailyClaimArgs, 'id' | 'subgraphError'>>;
  dailyClaims?: Resolver<Array<ResolversTypes['DailyClaim']>, ParentType, ContextType, RequireFields<QuerydailyClaimsArgs, 'skip' | 'first' | 'subgraphError'>>;
  _meta?: Resolver<Maybe<ResolversTypes['_Meta_']>, ParentType, ContextType, Partial<Query_metaArgs>>;
}>;

export interface TimestampScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Timestamp'], any> {
  name: 'Timestamp';
}

export type _Block_Resolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['_Block_'] = ResolversParentTypes['_Block_']> = ResolversObject<{
  hash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  number?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  timestamp?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  parentHash?: Resolver<Maybe<ResolversTypes['Bytes']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type _Meta_Resolvers<ContextType = MeshContext, ParentType extends ResolversParentTypes['_Meta_'] = ResolversParentTypes['_Meta_']> = ResolversObject<{
  block?: Resolver<ResolversTypes['_Block_'], ParentType, ContextType>;
  deployment?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hasIndexingErrors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
}>;

export type Resolvers<ContextType = MeshContext> = ResolversObject<{
  Beneficiary?: BeneficiaryResolvers<ContextType>;
  BigDecimal?: GraphQLScalarType;
  BigInt?: GraphQLScalarType;
  Bytes?: GraphQLScalarType;
  DailyClaim?: DailyClaimResolvers<ContextType>;
  Funds?: FundsResolvers<ContextType>;
  Int8?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  Timestamp?: GraphQLScalarType;
  _Block_?: _Block_Resolvers<ContextType>;
  _Meta_?: _Meta_Resolvers<ContextType>;
}>;

export type DirectiveResolvers<ContextType = MeshContext> = ResolversObject<{
  entity?: entityDirectiveResolver<any, any, ContextType>;
  subgraphId?: subgraphIdDirectiveResolver<any, any, ContextType>;
  derivedFrom?: derivedFromDirectiveResolver<any, any, ContextType>;
}>;

export type MeshContext = RefiMedellinUbiTypes.Context & BaseMeshContext;


const baseDir = pathModule.join(typeof __dirname === 'string' ? __dirname : '/', '..');

const importFn: ImportFn = <T>(moduleId: string) => {
  const relativeModuleId = (pathModule.isAbsolute(moduleId) ? pathModule.relative(baseDir, moduleId) : moduleId).split('\\').join('/').replace(baseDir + '/', '');
  switch(relativeModuleId) {
    case ".graphclient/sources/refi-medellin-ubi/introspectionSchema":
      return Promise.resolve(importedModule$0) as T;
    
    default:
      return Promise.reject(new Error(`Cannot find module '${relativeModuleId}'.`));
  }
};

const rootStore = new MeshStore('.graphclient', new FsStoreStorageAdapter({
  cwd: baseDir,
  importFn,
  fileType: "ts",
}), {
  readonly: true,
  validate: false
});

export const rawServeConfig: YamlConfig.Config['serve'] = undefined as any
export async function getMeshOptions(): Promise<GetMeshOptions> {
const pubsub = new PubSub();
const sourcesStore = rootStore.child('sources');
const logger = new DefaultLogger("GraphClient");
const cache = new (MeshCache as any)({
      ...({} as any),
      importFn,
      store: rootStore.child('cache'),
      pubsub,
      logger,
    } as any)

const sources: MeshResolvedSource[] = [];
const transforms: MeshTransform[] = [];
const additionalEnvelopPlugins: MeshPlugin<any>[] = [];
const refiMedellinUbiTransforms = [];
const additionalTypeDefs = [] as any[];
const refiMedellinUbiHandler = new GraphqlHandler({
              name: "refi-medellin-ubi",
              config: {"endpoint":"https://api.studio.thegraph.com/query/1757108/refi-colombia-subsidies/version/latest"},
              baseDir,
              cache,
              pubsub,
              store: sourcesStore.child("refi-medellin-ubi"),
              logger: logger.child("refi-medellin-ubi"),
              importFn,
            });
sources[0] = {
          name: 'refi-medellin-ubi',
          handler: refiMedellinUbiHandler,
          transforms: refiMedellinUbiTransforms
        }
const additionalResolvers = [] as any[]
const merger = new(BareMerger as any)({
        cache,
        pubsub,
        logger: logger.child('bareMerger'),
        store: rootStore.child('bareMerger')
      })
const documentHashMap = {
        "e4d2a0843663c4348f8c652badafc03db3f31261bc912de14d9369c9df595876": BeneficiariesDocument,
"95ecb258772a32d03b3c8da569565800324190a2cf35af4e3eaa8632ddb6ceff": DailyClaimsDocument,
"5fdb2969dcb8c7152241c2b73c1ee4d8a48eb0dce7aa9993c46d1f9e6d491664": FundsDocument
      }
additionalEnvelopPlugins.push(usePersistedOperations({
        getPersistedOperation(key) {
          return documentHashMap[key];
        },
        ...{}
      }))

  return {
    sources,
    transforms,
    additionalTypeDefs,
    additionalResolvers,
    cache,
    pubsub,
    merger,
    logger,
    additionalEnvelopPlugins,
    get documents() {
      return [
      {
        document: BeneficiariesDocument,
        get rawSDL() {
          return printWithCache(BeneficiariesDocument);
        },
        location: 'BeneficiariesDocument.graphql',
        sha256Hash: 'e4d2a0843663c4348f8c652badafc03db3f31261bc912de14d9369c9df595876'
      },{
        document: DailyClaimsDocument,
        get rawSDL() {
          return printWithCache(DailyClaimsDocument);
        },
        location: 'DailyClaimsDocument.graphql',
        sha256Hash: '95ecb258772a32d03b3c8da569565800324190a2cf35af4e3eaa8632ddb6ceff'
      },{
        document: FundsDocument,
        get rawSDL() {
          return printWithCache(FundsDocument);
        },
        location: 'FundsDocument.graphql',
        sha256Hash: '5fdb2969dcb8c7152241c2b73c1ee4d8a48eb0dce7aa9993c46d1f9e6d491664'
      }
    ];
    },
    fetchFn,
  };
}

export function createBuiltMeshHTTPHandler<TServerContext = {}>(): MeshHTTPHandler<TServerContext> {
  return createMeshHTTPHandler<TServerContext>({
    baseDir,
    getBuiltMesh: getBuiltGraphClient,
    rawServeConfig: undefined,
  })
}


let meshInstance$: Promise<MeshInstance> | undefined;

export const pollingInterval = null;

export function getBuiltGraphClient(): Promise<MeshInstance> {
  if (meshInstance$ == null) {
    if (pollingInterval) {
      setInterval(() => {
        getMeshOptions()
        .then(meshOptions => getMesh(meshOptions))
        .then(newMesh =>
          meshInstance$.then(oldMesh => {
            oldMesh.destroy()
            meshInstance$ = Promise.resolve(newMesh)
          })
        ).catch(err => {
          console.error("Mesh polling failed so the existing version will be used:", err);
        });
      }, pollingInterval)
    }
    meshInstance$ = getMeshOptions().then(meshOptions => getMesh(meshOptions)).then(mesh => {
      const id = mesh.pubsub.subscribe('destroy', () => {
        meshInstance$ = undefined;
        mesh.pubsub.unsubscribe(id);
      });
      return mesh;
    });
  }
  return meshInstance$;
}

export const execute: ExecuteMeshFn = (...args) => getBuiltGraphClient().then(({ execute }) => execute(...args));

export const subscribe: SubscribeMeshFn = (...args) => getBuiltGraphClient().then(({ subscribe }) => subscribe(...args));
export function getBuiltGraphSDK<TGlobalContext = any, TOperationContext = any>(globalContext?: TGlobalContext) {
  const sdkRequester$ = getBuiltGraphClient().then(({ sdkRequesterFactory }) => sdkRequesterFactory(globalContext));
  return getSdk<TOperationContext, TGlobalContext>((...args) => sdkRequester$.then(sdkRequester => sdkRequester(...args)));
}
export type BeneficiariesQueryVariables = Exact<{ [key: string]: never; }>;


export type BeneficiariesQuery = { beneficiaries: Array<Pick<Beneficiary, 'id' | 'totalClaimed' | 'dateAdded' | 'dateRemoved' | 'isActive'>> };

export type DailyClaimsQueryVariables = Exact<{ [key: string]: never; }>;


export type DailyClaimsQuery = { dailyClaims: Array<Pick<DailyClaim, 'id' | 'date' | 'totalClaims' | 'totalAmount' | 'beneficiaries'>> };

export type FundsQueryVariables = Exact<{ [key: string]: never; }>;


export type FundsQuery = { funds_collection: Array<Pick<Funds, 'id' | 'totalSupplied' | 'totalWithdrawn' | 'totalClaimed' | 'contractBalance'>> };


export const BeneficiariesDocument = gql`
    query Beneficiaries {
  beneficiaries {
    id
    totalClaimed
    dateAdded
    dateRemoved
    isActive
  }
}
    ` as unknown as DocumentNode<BeneficiariesQuery, BeneficiariesQueryVariables>;
export const DailyClaimsDocument = gql`
    query DailyClaims {
  dailyClaims(first: 60, orderBy: date, orderDirection: desc) {
    id
    date
    totalClaims
    totalAmount
    beneficiaries
  }
}
    ` as unknown as DocumentNode<DailyClaimsQuery, DailyClaimsQueryVariables>;
export const FundsDocument = gql`
    query Funds {
  funds_collection(where: {id: "0x947c6db1569edc9fd37b017b791ca0f008ab4946"}) {
    id
    totalSupplied
    totalWithdrawn
    totalClaimed
    contractBalance
  }
}
    ` as unknown as DocumentNode<FundsQuery, FundsQueryVariables>;




export type Requester<C = {}, E = unknown> = <R, V>(doc: DocumentNode, vars?: V, options?: C) => Promise<R> | AsyncIterable<R>
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {
    Beneficiaries(variables?: BeneficiariesQueryVariables, options?: C): Promise<BeneficiariesQuery> {
      return requester<BeneficiariesQuery, BeneficiariesQueryVariables>(BeneficiariesDocument, variables, options) as Promise<BeneficiariesQuery>;
    },
    DailyClaims(variables?: DailyClaimsQueryVariables, options?: C): Promise<DailyClaimsQuery> {
      return requester<DailyClaimsQuery, DailyClaimsQueryVariables>(DailyClaimsDocument, variables, options) as Promise<DailyClaimsQuery>;
    },
    Funds(variables?: FundsQueryVariables, options?: C): Promise<FundsQuery> {
      return requester<FundsQuery, FundsQueryVariables>(FundsDocument, variables, options) as Promise<FundsQuery>;
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;